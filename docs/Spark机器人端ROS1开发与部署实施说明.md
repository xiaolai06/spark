# Spark 机器人端 ROS1 开发与部署实施说明

> 编写日期：2026-09-30  
> 目标实机：既有资料记录为 Ubuntu 20.04.5 + ROS1 Noetic + NXROBO Spark。本文是**机器人侧实施蓝图与关键代码模板**，不是已在真机运行的程序。真实 Topic、消息类型、TF、底盘速度入口和语音字段必须在机器人上核实后填写；在此之前保持运动输出关闭。

## 1. 机器人端究竟要改什么

推荐**不直接修改厂家的 `spark_base`、`spark_navigation`、`spark_voice` 源码**。在机器人现有 catkin 工作空间新增 `spark_web_platform` 包，作为 Web 平台和厂家 ROS 节点之间的适配层。机器人端另部署现有 `server/` FastAPI 服务；浏览器只连 FastAPI，FastAPI 通过仅监听本机的 ROSBridge 访问 ROS。

```text
Web/机器人屏幕 → FastAPI :8010 → 本机 ROSBridge :9090 → spark_web_platform
                                                        ├─ 只读状态/地图/语音
                                                        ├─ move_base Action 适配
                                                        └─ 安全速度仲裁 → 唯一底盘速度入口
```

这套边界与[现有接口契约](Spark轮足机器人实验平台_最终开发说明.md)一致。仓库当前只有 Web 与 FastAPI 演示后端，**没有** `spark_web_platform`、真机 ROS 代码或真机测试结果，详见[当前实现盘点](当前实现盘点与Spark真机对接方案.md)。

### 机器人端建议文件清单

```text
~/catkin_ws/src/spark_web_platform/
├── package.xml                    catkin 依赖
├── CMakeLists.txt                  安装 Python 节点
├── config/
│   ├── topic_mapping.yaml         经实机确认的 Topic、frame、消息字段
│   └── safety.yaml                限速、超时、运动输出开关
├── launch/
│   ├── readonly.launch             状态/语音/本机 ROSBridge，先上线
│   └── control.launch              导航/安全仲裁；验收前只接调试输出
└── scripts/
    ├── status_bridge.py            位姿、速度、传感器、系统资源 → 统一状态
    ├── voice_bridge.py             厂家 STT → 统一语音事件
    ├── navigation_bridge.py        经批准的目标 → move_base Action
    └── safety_mux.py               导航/遥控速度仲裁与独立 Watchdog
```

另外需要修改本仓库的 `server/app/routers/robots.py` 和新增 `server/app/services/`：把当前固定演示状态替换为可切换的 Mock/ROS 适配器，实现真机健康、鉴权、租约、任务与命令审核。`web/` 最后才替换页面里的固定示例。这些改动属于**后续实现工作**，本说明没有把它们冒充已完成代码。

## 2. 先在真机采集事实，再填配置

连接 Spark 机器人终端后，先确认实际启动工作空间；不要假设一定叫 `~/catkin_ws`。在 ROS 节点已经启动的终端执行：

```bash
source /opt/ros/noetic/setup.bash
source ~/catkin_ws/devel/setup.bash     # 改为机器人实际工作空间
echo "$ROS_DISTRO $ROS_MASTER_URI"
rosnode list
rostopic list
rostopic list -v
rosparam list
rosrun tf tf_echo map base_link       # 若 frame 名不同，改用实际名称
```

对每个候选接口分别执行 `rostopic type <实际topic>`、`rosmsg show <消息类型>`、`rostopic hz <实际topic>` 和短时间 `rostopic echo -n 1 <实际topic>`。重点采集如下：

| 用途 | 文档候选值，非已验证 | 必须记录的实机结果 |
|---|---|---|
| 里程计与实际速度 | `/odom` | Topic、`nav_msgs/Odometry` 是否匹配、`child_frame_id`、频率 |
| 地图定位 | `/amcl_pose` 或 `map → base_link` TF | 定位来源、坐标系、时间戳、无定位时表现 |
| 栅格地图 | `/map` | 是否为 `nav_msgs/OccupancyGrid`、尺寸、分辨率、地图版本 |
| 雷达 | `/scan` | Topic、消息型别、频率、停止节点后的超时 |
| 相机 | `/camera/color/image_raw` 等 | D435 实际 RGB/Depth Topic、分辨率、帧率、USB 连接 |
| 导航 | `/move_base` | Action 是否存在、目标 frame、取消与结果状态 |
| 导航速度输出 | `move_base` 的 `cmd_vel` | **实际发布者、最终底盘订阅者、重映射可否生效** |
| 底盘速度入口 | `/cmd_vel` | **真实驱动订阅的 Topic、是否已有速度仲裁/硬件保护** |
| 语音转写 | `/voice/stt` | **真实消息类型和文本、final、置信度、时间字段** |
| 电池/充电 | 尚未确认 | 实际 Topic、单位、容量/百分比计算规则 |
| 设备路径 | `/dev/sparkBase`、`/dev/ydlidar` | 实际 udev 链接及启动文件引用 |

检查速度链路时使用 `rostopic info <候选速度topic>` 看所有发布者与订阅者。**只读检查，不向底盘速度 Topic 发布测试指令。** 如果导航节点或其他进程绕过仲裁直接向底盘发布，软件急停就无法保证最终停车，必须先修正 launch 重映射和实际连线。`/voice/stt` 的消息类型未知，因此下面语音代码采用字段映射模板，不能直接假定它是 `std_msgs/String`。

## 3. 统一 Topic 与数据契约

### 3.1 `config/topic_mapping.yaml` 模板

以下是**候选配置**，把 `VERIFY_ON_ROBOT` 改成真机采集值后才能启用对应订阅：

```yaml
robot_id: spark-01
frames:
  map: map
  base: base_link
topics:
  odom: /odom
  pose: /amcl_pose
  scan: /scan
  map: /map
  rgb: /camera/color/image_raw
  depth: /camera/depth/image_rect_raw
  stt: /voice/stt
  nav_action: /move_base
  nav_cmd_vel: /spark_web/nav_cmd_vel
  base_cmd_vel: VERIFY_ON_ROBOT
voice_fields:
  text: VERIFY_ON_ROBOT
  final: VERIFY_ON_ROBOT
  confidence: VERIFY_ON_ROBOT
  stamp: VERIFY_ON_ROBOT
```

YAML 只描述已核实的 ROS 接口；不要把本次文档里出现的 `192.168.3.18`、30 FPS、CPU 温度或电池数值写成运行默认值。地图位姿、速度、系统资源、导航结果均要附带采集时间；超过阈值后归为 `unknown/offline`。电池来源未确认前返回 `null`。

### 3.2 自定义 ROS 接口

只读状态和语音首期可用 `std_msgs/String` 承载 **JSON 事件**。真实运动控制更适合使用带固定字段的自定义 `.msg/.srv`，在 catkin 构建时检查消息结构；第 7 节给出安全逻辑模板，在消息定义和安全门禁完成前不启用。所有接口只在机器人本机可信 ROS 图内使用，FastAPI 仍要做严格 schema 校验。

| Topic | 类型 | 数据意义 |
|---|---|---|
| `/spark_web/status` | `std_msgs/String` | 1 Hz 全量快照：`robotId, source, sampledAt, online, ...`；字段形状与 Web `RobotStatus` 对齐 |
| `/spark_web/voice/transcript` | `std_msgs/String` | `eventId, robotId, text, isFinal, confidence, sampledAt` |
| `/spark_web/navigation/status` | `std_msgs/String` | 目标 ID、Action 状态、失败原因、时间 |
| `/spark_web/teleop/command` | `TeleopCommand.msg` | 租约 ID、递增序号、线/角速度、发送时间 |
| `/spark_web/teleop/heartbeat` | `TeleopHeartbeat.msg` | 租约 ID、递增序号、发送时间 |
| `/spark_web/gateway/heartbeat` | `std_msgs/String` | 后端实例 ID、递增序号；由机器人端记录接收时刻，供导航和遥控超时判定 |
| `/spark_web/safety/state` | `std_msgs/String` | 急停、租约、Watchdog、当前速度来源和拒绝原因 |

控制操作使用以下 ROS Service；`/spark_web/nav_cmd_vel` 为导航速度输入，`/spark_web/debug/cmd_vel` 为未通过安全门禁时的输出。`std_msgs/String` JSON 要保持字段版本号并校验长度、类型、有限数值、ID 和时间。控制命令不能仅凭 ROS Topic 访问即被信任，后端必须先鉴权和审计。真机控制阶段建议新增：

```text
# msg/TeleopCommand.msg
string lease_id
uint64 sequence
time issued_at
geometry_msgs/Twist twist

# msg/TeleopHeartbeat.msg
string lease_id
uint64 sequence
time issued_at

# srv/SubmitNavigationGoal.srv
string command_id
string frame_id
float64 x
float64 y
float64 yaw_rad
---
bool forwarded
string reason

# srv/CancelNavigation.srv
string command_id
---
bool forwarded
string reason

# srv/SetEmergencyStop.srv
string command_id
string reason
---
bool latched
string reason

# srv/ResetEmergencyStop.srv
string command_id
---
bool reset
string reason
```

`issued_at` 用于拒绝明显过旧请求和记录审计；失联停车仍以**机器人本机接收时刻的单调时钟**判定。Service 的 `forwarded=true` 只表示通过校验并交给 Action 客户端，实际执行结果必须由 Action 回调提供。`SetEmergencyStop` 负责锁存急停并取消导航；`ResetEmergencyStop` 必须经后端角色校验和机器人端复位条件检查，不能由请求里的自称身份决定。新增消息时在 `package.xml` 声明 `message_generation/message_runtime`，在 `CMakeLists.txt` 添加 `add_message_files`、`add_service_files`、`generate_messages(DEPENDENCIES geometry_msgs)`，然后重新编译工作空间。Web API 的请求/响应格式保持稳定。

## 4. catkin 包如何创建和编译

在**机器人**的实际 catkin 工作空间操作，先备份原有 launch 配置；不要覆盖厂家包：

```bash
cd ~/catkin_ws/src
catkin_create_pkg spark_web_platform rospy std_msgs geometry_msgs nav_msgs sensor_msgs actionlib actionlib_msgs move_base_msgs tf
mkdir -p spark_web_platform/{config,launch,scripts}
```

`CMakeLists.txt` 至少包含：

```cmake
cmake_minimum_required(VERSION 3.0.2)
project(spark_web_platform)
find_package(catkin REQUIRED COMPONENTS
  rospy std_msgs geometry_msgs nav_msgs sensor_msgs
  actionlib actionlib_msgs move_base_msgs tf)
catkin_package()
catkin_install_python(PROGRAMS
  scripts/status_bridge.py
  scripts/voice_bridge.py
  scripts/navigation_bridge.py
  scripts/safety_mux.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION})
install(DIRECTORY config launch
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION})
```

上面的 CMake 是**只读阶段**配置；添加第 3.2 节的自定义消息/服务时，再把 `message_generation` 加进 `find_package`、声明消息文件并调用 `generate_messages`，同时把 `message_runtime` 加进 `catkin_package(CATKIN_DEPENDS ...)`。生成的 `package.xml` 保留 `catkin` buildtool 依赖，并逐项声明上述运行依赖及消息生成/运行依赖。`readonly.launch` 还依赖 `rosbridge_server`（其 launch 会启动 `rosapi`），机器人上需核实 `rospack find rosbridge_server` 与 `rospack find rosapi`，缺失时安装与 Noetic 匹配的包并在 `package.xml` 声明运行依赖。若状态节点读取系统资源，用 Ubuntu 系统 Python 的 `python3-psutil`；不要用 Windows 前端环境的依赖代替 ROS Python 依赖。Noetic 使用 Python 3；shebang 用 `#!/usr/bin/env python3`。`catkin_install_python` 是 catkin 安装 Python 节点的常规方式。[catkin 安装说明](https://docs.ros.org/en/kinetic/api/catkin/html/howto/format1/installing_python.html)

```bash
cd ~/catkin_ws
catkin_make
source devel/setup.bash
rospack find spark_web_platform
```

如果现有工作空间使用 `catkin build` 而非 `catkin_make`，沿用原工程工具，不混用生成目录。

## 5. 只读状态节点：关键代码怎么写

`scripts/status_bridge.py` 的职责是采集 ROS 消息、计算新鲜度、生成统一快照，**不负责控制底盘**。下面的核心模板选择**AMCL `PoseWithCovarianceStamped`** 作为定位来源；`~odom_topic`、`~pose_topic`、`~scan_topic` 必须来自已核实配置。若现场仅有 `map → base_link` TF，应改用下方 TF 分支，不能把 TF frame 名填入 `pose_topic`。使用单调时钟判断消息过期，避免系统时间校准造成误判。

```python
#!/usr/bin/env python3
import json
import math
import threading
import time
from datetime import datetime, timezone

import rospy
from geometry_msgs.msg import PoseWithCovarianceStamped
from nav_msgs.msg import Odometry
from sensor_msgs.msg import LaserScan
from std_msgs.msg import String
from tf.transformations import euler_from_quaternion


def yaw_of(q):
    return euler_from_quaternion([q.x, q.y, q.z, q.w])[2]  # 弧度


def finite_or_none(value):
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


class StatusBridge:
    def __init__(self):
        self.robot_id = rospy.get_param('~robot_id', 'spark-01')
        self.pose = None
        self.motion = None
        self.last_seen = {}
        self.lock = threading.Lock()
        self.pub = rospy.Publisher('/spark_web/status', String, queue_size=2)
        rospy.Subscriber(rospy.get_param('~odom_topic'), Odometry,
                         self.on_odom, queue_size=2)
        rospy.Subscriber(rospy.get_param('~pose_topic'), PoseWithCovarianceStamped,
                         self.on_pose, queue_size=2)
        rospy.Subscriber(rospy.get_param('~scan_topic'), LaserScan,
                         self.on_scan, queue_size=2)
        rospy.Timer(rospy.Duration(1.0), self.publish)

    def fresh(self, key, seconds):
        seen = self.last_seen.get(key)
        return seen is not None and time.monotonic() - seen < seconds

    def on_odom(self, msg):
        with self.lock:
            self.motion = {
                'linearVelocity': finite_or_none(msg.twist.twist.linear.x),
                'angularVelocity': finite_or_none(msg.twist.twist.angular.z),
            }
            self.last_seen['odom'] = time.monotonic()

    def on_pose(self, msg):
        p, q = msg.pose.pose.position, msg.pose.pose.orientation
        with self.lock:
            self.pose = {'x': finite_or_none(p.x), 'y': finite_or_none(p.y),
                         'yaw': finite_or_none(yaw_of(q))}
            self.last_seen['pose'] = time.monotonic()

    def on_scan(self, _msg):
        with self.lock:
            self.last_seen['scan'] = time.monotonic()

    def publish(self, _event):
        with self.lock:
            data = {
                'schemaVersion': 1,
                'robotId': self.robot_id,
                'source': 'ros',
                'sampledAt': datetime.now(timezone.utc).isoformat(),
                'online': self.fresh('odom', 2.0),
                'pose': self.pose if self.fresh('pose', 2.0)
                        else {'x': None, 'y': None, 'yaw': None},
                'motion': self.motion if self.fresh('odom', 2.0)
                          else {'linearVelocity': None, 'angularVelocity': None},
                'sensors': {'lidar': 'online' if self.fresh('scan', 2.0)
                            else 'unknown'},
                'power': {'percentage': None, 'voltage': None, 'current': None,
                          'temperature': None, 'chargingStatus': 'unknown'},
            }
        self.pub.publish(String(data=json.dumps(data, ensure_ascii=False,
                                                 allow_nan=False)))


if __name__ == '__main__':
    rospy.init_node('spark_web_status_bridge')
    StatusBridge()
    rospy.spin()
```

上面只给**已接入的字段**赋值。非有限数会转为 `null`，避免 `json.dumps(allow_nan=False)` 因 NaN/Inf 失败。`system`、`network`、导航与任务状态应由同一状态聚合器或后端补齐真实采集结果，不能从旧 Mock 复制。CPU 温度需要核实 Linux 热区名称，不能随便把一个热区标成 CPU Package。`yaw` 此处为弧度；当前 Web 演示状态里出现的角度样例与点位弧度并不统一，接入前须明确对外统一单位。`nav_msgs/Odometry` 的 twist 是速度估计，不能拿网页设定速度冒充实际速度。[Odometry 消息定义](https://github.com/ros/common_msgs/blob/noetic-devel/nav_msgs/msg/Odometry.msg)

如定位来源是 TF，移除 `PoseWithCovarianceStamped` 订阅并在状态采样前查询 `map → base_link`（frame 使用现场值）：

```python
import tf

listener = tf.TransformListener()
try:
    stamp = listener.getLatestCommonTime('map', 'base_link')
    if (rospy.Time.now() - stamp).to_sec() > 2.0:
        raise RuntimeError('POSE_STALE')
    trans, quat = listener.lookupTransform('map', 'base_link', rospy.Time(0))
    # 在同一把锁内更新 pose 与 last_seen['pose']
    pose = {'x': finite_or_none(trans[0]), 'y': finite_or_none(trans[1]),
            'yaw': finite_or_none(euler_from_quaternion(quat)[2])}
except (tf.LookupException, tf.ConnectivityException,
        tf.ExtrapolationException, RuntimeError):
    pose = None  # 对外返回 null，不沿用旧定位
```

若真机实际使用标准 `sensor_msgs/BatteryState`，其中 `percentage` 是 **0–1** 的比例，Web 契约使用 **0–100** 的百分数，适配时需乘 100 并检查有效值；若底盘发布的是厂家自定义字段，则按实机单位单独映射。没有真实电池来源时保持 `null`。[ROS1 BatteryState 定义](https://github.com/ros/common_msgs/blob/noetic-devel/sensor_msgs/msg/BatteryState.msg)

## 6. 地图、视频、语音分别怎样接

### 地图与路径

订阅实际地图 Topic 的 `nav_msgs/OccupancyGrid`，读取 `header.frame_id`、`info.resolution`、`width`、`height`、`origin`、`data`。栅格数据按行存储，`-1` 未知、`0–100` 为占用概率。转换时先验证 `len(data) == width * height`，保留有符号 `-1`，并把 `info.origin.orientation` 的四元数转换为 yaw；不能默认地图原点朝向为零。

```python
def occupancy_grid_to_api(msg):
    if msg.info.width == 0 or msg.info.height == 0:
        return {'available': False, 'data': None}
    if len(msg.data) != msg.info.width * msg.info.height:
        raise ValueError('MAP_SIZE_MISMATCH')
    p, q = msg.info.origin.position, msg.info.origin.orientation
    return {
        'frameId': msg.header.frame_id,
        'resolution': msg.info.resolution,
        'width': msg.info.width,
        'height': msg.info.height,
        'origin': {'x': p.x, 'y': p.y, 'yaw': yaw_of(q)},
        'data': list(msg.data),  # 保留 -1；大地图改用压缩传输
        'available': True,
    }
```

后端缓存地图版本/时间，并在 `/api/v1/robots/{id}/map` 返回压缩地图与元数据。地图可能很大，不按 5–10 Hz 经 WebSocket 全量推送。点位必须记录所属地图及 frame，地图切换时拒绝旧点位。[ROS1 OccupancyGrid](https://github.com/ros/common_msgs/blob/noetic-devel/nav_msgs/msg/OccupancyGrid.msg)、[MapMetaData](https://github.com/ros/common_msgs/blob/noetic-devel/nav_msgs/msg/MapMetaData.msg)

### D435 视频

确认真实图像 Topic 后，使用 `web_video_server` 将 ROS 图像转为 MJPEG 流；FastAPI 或受限反向代理统一提供给浏览器。视频不要作为 ROSBridge JSON 事件传输。示例：

```bash
rosrun web_video_server web_video_server _address:=127.0.0.1 _port:=8080
# 仅在机器人本机查看；实际 topic 按采集表替换：
curl --max-time 5 -o /tmp/spark_rgb.jpg 'http://127.0.0.1:8080/snapshot?topic=/实际RGB图像Topic'
```

浏览器需要通过 FastAPI/代理获得受保护的视频 URL；直接把 `:8080` 暴露给局域网会绕过平台鉴权。首期按一台 D435 的 RGB/Depth 处理，页面四画面只是设计预览。[web_video_server 项目说明](https://github.com/RobotWebTools/web_video_server)

### 机器人本机语音

先用 `rostopic type /voice/stt` 和 `rosmsg show <实际类型>` 确认字段。例如若厂家消息含 `text/final/confidence/header.stamp`，才按这些字段读取；没有的字段保留 `null`。适配流程：

```python
# voice_bridge.py 的核心逻辑；MsgType 必须由真机 rosmsg show 后替换
from ACTUAL_MESSAGE_PACKAGE.msg import ActualSttMessage as MsgType

def on_stt(msg):
    text = str(msg.ACTUAL_TEXT_FIELD).strip()
    if not text:
        return
    event = {
        'schemaVersion': 1,
        'eventId': next_event_id(),       # robotId + 启动 ID + 递增序号
        'robotId': 'spark-01',
        'source': 'robot',
        'text': text,
        'isFinal': bool(msg.ACTUAL_FINAL_FIELD),
        'confidence': float(msg.ACTUAL_CONFIDENCE_FIELD),
        'sampledAt': utc_now_iso(),
    }
    transcript_pub.publish(String(data=json.dumps(event, ensure_ascii=False)))

rospy.Subscriber('/voice/stt', MsgType, on_stt, queue_size=10)
```

`ACTUAL_*` 是待实机填写的**明确占位符**，不是可直接运行的 Python 属性。若消息只有文字，没有 final/置信度，应把 `isFinal` 约定为明确规则、`confidence` 返回 `null`；不能伪造 0.96。机器人屏幕和 Web 从同一事件流展示最终文本；后端按 `eventId` 去重、落库和补历史。若源消息有稳定 ID/时间戳，优先用它生成幂等键；仅有启动 ID 和本地序号时只能保证同一桥进程内去重，节点重启后仍可能重复，需要结合原文与时间窗口处理。语音命令若要执行，另走后端唯一任务入口与权限/安全门禁，不能在 `on_stt` 中直接导航。

## 7. 导航、遥控和急停：机器人端代码边界

### 7.1 导航使用 Action，不把“受理”当“到达”

`navigation_bridge.py` 使用 `actionlib.SimpleActionClient` 连接真机核实后的 `move_base` Action。核心代码如下：

```python
import math
import threading
import actionlib
import rospy
from actionlib_msgs.msg import GoalStatus
from move_base_msgs.msg import MoveBaseAction, MoveBaseGoal

class NavigationBridge:
    def __init__(self, action_name, map_frame):
        self.client = actionlib.SimpleActionClient(action_name, MoveBaseAction)
        self.map_frame = map_frame
        self.lock = threading.Lock()
        self.goal_in_flight = False

    def send_navigation_goal(self, x, y, yaw_rad, enabled):
        if not enabled:
            raise RuntimeError('REAL_MOTION_DISABLED')
        if not all(math.isfinite(v) for v in (x, y, yaw_rad)):
            raise ValueError('INVALID_GOAL')
        if not self.client.wait_for_server(rospy.Duration(1.0)):
            raise RuntimeError('NAVIGATION_NOT_READY')
        with self.lock:
            if self.goal_in_flight:
                raise RuntimeError('TASK_CONFLICT')  # 不让新目标遗失旧目标
            self.goal_in_flight = True
        goal = MoveBaseGoal()
        goal.target_pose.header.frame_id = self.map_frame
        goal.target_pose.header.stamp = rospy.Time.now()
        goal.target_pose.pose.position.x = x
        goal.target_pose.pose.position.y = y
        goal.target_pose.pose.orientation.z = math.sin(yaw_rad / 2.0)
        goal.target_pose.pose.orientation.w = math.cos(yaw_rad / 2.0)
        try:
            self.client.send_goal(goal, done_cb=self.on_done,
                                  active_cb=self.on_active,
                                  feedback_cb=self.on_feedback)
        except Exception:
            with self.lock:
                self.goal_in_flight = False
            raise
        return {'forwarded': True}  # 不表示 Action 已接受或机器人已移动

    def cancel_navigation_goal(self):
        self.client.cancel_goal()  # 之后仍需等待 on_done 确认取消结果

    def on_active(self):
        publish_navigation_state('planning')

    def on_feedback(self, feedback):
        publish_distance_if_pose_is_fresh(feedback.base_position)
        # 仅在真实位姿/速度确认运动后报告 moving

    def on_done(self, state, _result):
        with self.lock:
            self.goal_in_flight = False
        if state == GoalStatus.SUCCEEDED:
            publish_navigation_state('success')
        elif state in (GoalStatus.PREEMPTED, GoalStatus.RECALLED):
            publish_navigation_state('cancelled')
        else:
            publish_navigation_state('failed', reason=str(state))
```

这里的 `publish_navigation_state` 和 `publish_distance_if_pose_is_fresh` 是业务回报函数，需在节点中实现并写入 `/spark_web/navigation/status`；Action 名、frame 和目标可达性需要实机确认。后端对每个请求生成命令 ID，Service 成功时只报告 `forwarded`，**Action 激活回调不等于底盘已经移动**；随后用 Action 反馈、实际速度和完成回调更新状态。若要替换目标，先取消旧目标并等它到终态，再提交新目标；`SimpleActionClient.send_goal()` 自身不会替你取消旧目标。`move_base_simple/goal` 不提供完整业务结果，不用作正式任务入口。[ROS1 actionlib SimpleActionClient](https://github.com/ros/actionlib/blob/noetic-devel/actionlib/src/actionlib/simple_action_client.py)、[move_base 实现](https://github.com/ros-planning/navigation/blob/noetic-devel/move_base/src/move_base.cpp)

### 7.2 速度必须由唯一仲裁节点输出

不能让 `move_base` 和网页遥控同时直接发布给底盘，也不能在它们继续发布非零速度时另向同一 Topic 发布零速度。应在真机 launch 中把导航速度重映射至 `/spark_web/nav_cmd_vel`，网页遥控只进入 `/spark_web/teleop/command`；`safety_mux.py` 为**最终底盘速度入口的唯一发布者**。如果厂家已经自带速度仲裁，需要先读它的接口及失联停车逻辑，再决定复用或替换，不能叠加两个未知仲裁器。

控制状态机优先级：`急停 → 零速度`；`后端心跳新鲜 + 有效租约 + 遥控心跳/命令新鲜 → 限速后遥控`；`后端心跳新鲜 + 导航已授权 + 导航速度新鲜 → 限速后导航`；其余全部输出零速度。后端心跳失效时同时取消导航目标，避免后端恢复后继续执行旧目标。导航和遥控模式切换时先取消旧目标/租约，再切换速度来源。限速是后端和机器人端**双重校验**；两端配置应取更保守值。还需盘点原有手柄、机身按钮和厂家遥控节点，不能让它们绕过最终仲裁。

```python
# safety_mux.py 关键计时逻辑；完整实现还需租约、序号、权限及状态机
import math
import time
from geometry_msgs.msg import Twist

def on_teleop_command(msg):
    # msg 类型是 spark_web_platform/TeleopCommand，不是 JSON String
    if msg.lease_id != active_lease_id:
        return reject('CONTROL_LEASE_REQUIRED')
    if msg.sequence <= last_sequence:
        return reject('STALE_COMMAND')
    values = (msg.twist.linear.x, msg.twist.angular.z)
    if not all(math.isfinite(value) for value in values):
        return reject('INVALID_VELOCITY')
    # 还需检查 issued_at、租约到期和所有未用轴，再更新序号与限速值
    accept_clamped_velocity(msg.twist)
    last_teleop_seen = time.monotonic()

def on_teleop_heartbeat(msg):
    # TeleopHeartbeat：校验 lease_id 与递增 sequence 后记录本机接收时间
    update_teleop_heartbeat(msg, time.monotonic())

def on_gateway_heartbeat(msg):
    # std_msgs/String：校验实例 ID 和递增序号，记录本机接收时间
    update_gateway_heartbeat(msg.data, time.monotonic())

def on_nav_twist(msg):
    # geometry_msgs/Twist：保存限速后的导航速度和本机接收时间
    update_navigation_velocity(msg, time.monotonic())

def publish_cycle():
    now = time.monotonic()
    if emergency_stop or not enable_hardware_output:
        selected = Twist()  # 零速度
    elif gateway_fresh(now, 0.5) and lease_valid(now) and heartbeat_fresh(now, 0.5) and teleop_fresh(now, 0.5):
        selected = bounded_teleop_twist()
    elif gateway_fresh(now, 0.5) and navigation_authorized and nav_fresh(now, 0.5):
        selected = bounded_nav_twist()
    else:
        selected = Twist()
    output_pub.publish(selected)

def run_watchdog():
    while not rospy.is_shutdown():
        publish_cycle()
        time.sleep(0.05)  # 墙上时钟；不依赖 ROS 仿真时间推进
```

以上是**安全规则模板，不是可独立运行的完整 `safety_mux.py`**。节点分别订阅 `/spark_web/teleop/command`、`/spark_web/teleop/heartbeat`、`/spark_web/gateway/heartbeat` 与 `/spark_web/nav_cmd_vel`，上面四个回调是各新鲜度计时器的更新点。`active_lease_id`、`last_sequence`、到期时间、心跳实例/序号、拒绝事件、模式切换与真实发布 Topic 都必须实现，并用互斥锁保护 ROS 回调与 `run_watchdog()` 共用的状态。网关心跳失效时还应调用导航取消接口，清除 `navigation_authorized`，不能仅输出零速度后让旧目标留在 Action server 中。Watchdog 使用 `time.monotonic()` 和真实时间循环，避免 ROS 仿真时间停滞时停止停车检查。`enable_hardware_output` 默认 `false`，此时 `output_pub` 指向 `/spark_web/debug/cmd_vel`。只有在确认所有底盘速度发布者已重映射、硬件急停可用、超时测试通过后，才能把唯一输出连接到已核实的底盘入口。ROS `geometry_msgs/Twist` 的线/角速度字段见[ROS1 消息定义](https://github.com/ros/common_msgs/blob/noetic-devel/geometry_msgs/msg/Twist.msg)。

急停动作必须在机器人端取消 `move_base` 目标、释放租约、锁存急停状态并持续输出零速度；复位仅允许授权人员在危险消除后执行，且不能自动恢复旧命令。软件急停不能替代机械/电气硬件急停。Watchdog 进程崩溃后也无法继续输出零速度，因此还要确认**底盘驱动自身是否有通信超时停车**；若没有，必须在驱动/硬件层增加独立超时保护，不能只靠 Web/ROS Python 进程。

### 7.3 `config/safety.yaml` 初始值

```yaml
enable_hardware_output: false
output_topic: /spark_web/debug/cmd_vel
teleop_deadline_s: 0.5
nav_deadline_s: 0.5
publish_rate_hz: 20
# 下列限值需由机器人厂家规格和场地低速测试确定；此处不提供猜测数值。
max_linear_mps: VERIFY_ON_ROBOT
max_angular_radps: VERIFY_ON_ROBOT
```

## 8. Launch 与部署顺序

`readonly.launch` 先只启动采集和本机桥，不启动控制节点。示意：

```xml
<launch>
  <node pkg="spark_web_platform" type="status_bridge.py"
        name="spark_web_status_bridge" output="screen">
    <param name="robot_id" value="spark-01"/>
    <param name="odom_topic" value="/已确认的odom"/>
    <param name="pose_topic" value="/已确认的定位"/>
    <param name="scan_topic" value="/已确认的雷达"/>
  </node>
  <!-- voice_bridge.py 在消息类型和字段确认后加入 -->
  <include file="$(find rosbridge_server)/launch/rosbridge_websocket.launch">
    <arg name="address" value="127.0.0.1"/>
    <arg name="port" value="9090"/>
    <arg name="topics_glob" value="[/spark_web/status,/spark_web/voice/transcript]"/>
    <arg name="services_glob" value="[]"/>
    <arg name="params_glob" value="[]"/>
  </include>
</launch>
```

ROSBridge 的 ROS1 launch 支持 `address` 和访问范围参数，默认配置是 `address=0.0.0.0`、`authenticate=false`、Topic/Service/参数允许范围为 `[*]`，因此只读阶段显式限制监听地址和访问范围。上述 `[]`/列表参数要在机器人安装的 ROSBridge 版本中核实解析结果，并用实际连接测试确认控制 Topic/Service 不可访问。**本机触控屏浏览器仍可能访问 `127.0.0.1:9090`**；loopback 与 allowlist 不能证明调用者身份，绝不能单独作为真实运动控制的安全边界。开放控制前须部署并验证认证与进程/网络隔离，或改用仅后端进程可访问的私有 IPC 控制网关；未完成前保持控制 Service 不暴露、`enable_hardware_output=false`。[ROS1 rosbridge launch 源码](https://github.com/RobotWebTools/rosbridge_suite/blob/ros1/rosbridge_server/launch/rosbridge_websocket.launch)

机器人端推荐按顺序启动：已有厂家底盘/雷达/相机/定位/导航节点 → `readonly.launch` → FastAPI 的 ROS 模式 → Web 页面。只读验收通过后，再单独启动 `control.launch` 的**调试输出模式**，检查 Topic 图和停车路径；最终才考虑真实底盘输出。FastAPI 正式部署时应设置强 JWT 密钥、关闭或替换演示账号、限制 CORS 和 API 访问；视频与 ROSBridge 不直接暴露外网。

```bash
roslaunch spark_web_platform readonly.launch
rostopic echo -n 1 /spark_web/status
rostopic hz /spark_web/status
rosnode info /spark_web_status_bridge
ss -lntp | grep -E ':9090|:8080|:8010'
```

FastAPI 侧的最小订阅示例（新增 `RosRobotAdapter`，不要写进 React）：

```python
import json
import roslibpy

ros = roslibpy.Ros(host='127.0.0.1', port=9090)
ros.run()
topic = roslibpy.Topic(ros, '/spark_web/status', 'std_msgs/String')

def on_status(message):
    snapshot = json.loads(message['data'])
    validate_robot_status(snapshot)       # Pydantic / 业务 schema
    status_cache.replace(snapshot)        # 记录到达时间，过期即离线

topic.subscribe(on_status)
```

在现有 `server/app/routers/robots.py`，`GET /status` 读取 `status_cache`，WebSocket 发送更新；连接丢失或超过新鲜度时返回 `online:false` 与 `null/unknown`，不要退回固定“真机在线”。操作命令需经 JWT、角色、租约、急停和限速校验，再由后端唯一入口转给 ROS 适配节点。当前项目 `server/requirements.txt` 尚未声明 `roslibpy`，真机实现时需增加并锁定部署版本。

### 8.1 FastAPI 在机器人上常驻

推荐把 FastAPI 放在独立 Python 虚拟环境中运行，避免改动 ROS 系统 Python 包。机器人现有 Ubuntu 20.04 通常使用 Python 3.8，因此应在**实机**锁定并安装与其兼容的 FastAPI、Pydantic、SQLAlchemy、roslibpy 版本；当前 `server/requirements.txt` 的宽松 `>=` 不能当作生产锁文件。正式服务应由 systemd 管理，例如把项目部署到 `/home/spark/spark_platform/` 后：

```ini
# /etc/systemd/system/spark-platform-api.service 参考模板
[Unit]
Description=Spark platform FastAPI
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=spark
WorkingDirectory=/home/spark/spark_platform/server
EnvironmentFile=/home/spark/spark_platform_data/platform.env
ExecStart=/home/spark/spark_platform/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8010
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

`platform.env` 至少设置强随机 `SPARK_JWT_SECRET`、数据库位置和允许的前端来源，并限制文件读取权限。当前后端启动会自动播种演示账号，且普通用户可通过资料接口修改自己的角色；这两处必须修正后才能把 API 用于真机控制。API 与 ROSBridge 都监听本机，由受限反向代理向局域网提供 HTTPS/WebSocket/视频入口。若教学现场暂时只做内网只读演示，也需设置访问控制和明确的演示标识。

前端是构建时配置：部署时把 `VITE_API_BASE_URL` 设为实际代理地址下的 `https://<机器人主机>/api/v1`，`VITE_WS_BASE_URL` 设为 `wss://<机器人主机>/ws/v1`，再执行构建。当前开发默认地址是 Windows 本机 `127.0.0.1:8010`，直接复制构建产物到机器人不会自动改成机器人地址。代理还需处理 WebSocket Upgrade 和视频流；验收时从 Windows 浏览器实际访问同一个入口。

## 9. 分阶段验收，完成的定义

| 阶段 | 必须能观察到的结果 |
|---|---|
| 实机采集 | 每个候选 Topic/消息类型/frame/频率均有终端记录；底盘速度发布者和订阅者已画清楚。 |
| 只读状态 | 真实位姿/速度/雷达健康和系统资源显示，断流按阈值变未知；电池无来源保持 `--`。 |
| 地图视频 | OccupancyGrid 坐标与机器人位姿匹配；RGB 断流提示明确；视频不绕过平台鉴权。 |
| 语音 | 机器人说话后本机屏幕与 Web 同步同一最终文本；重连不重复落库或执行。 |
| 导航调试 | 目标经 Action 进入接受、执行、完成/失败/取消状态；调试速度只到 `/spark_web/debug/cmd_vel`。 |
| 速度仲裁 | ROS 图中底盘入口只有经确认的单一发布路径；双来源不会相互抢速度。 |
| 停车安全 | 松手、页面失焦、WebSocket 断开、服务端停止、租约到期、ROS 节点故障、急停均完成停车测试；驱动层断连超时独立验证。 |
| 低速实机 | 有硬件急停监护、限速和空旷场地，先短距离导航/遥控，再验收巡检任务。 |

每次验收都保存命令、节点图、日志和时间戳；状态网页截图不能替代底盘实际动作或停车证据。机器人端验证前先备份原有 launch、映射和驱动配置，改动只放在新增包与受控部署配置中。

## 10. 当前还缺哪些真机资料

要把本文的占位符替换成**可以在 Spark 上直接编译运行的最终代码**，至少需要：

1. `rostopic list -v`、`rosnode list`，以及地图、里程计、定位、雷达、相机、语音、电池 Topic 的 `rostopic type` / `rosmsg show`。
2. `rostopic info` 查到的导航速度输出和底盘最终速度入口；现有厂家 launch 文件中 `cmd_vel` 的重映射与 mux 设置。
3. `/voice/stt` 的一条匿名化实际消息与机器人屏幕显示入口。
4. 硬件急停方式、底盘驱动通信超时停车机制、允许的最大线/角速度。
5. 机器人实际 catkin 工作空间、开机启动方式和局域网访问方式。

拿到这些数据后，下一次开发应把 `VERIFY_ON_ROBOT` 与 `ACTUAL_*` 全部替换、补全节点、编译并按第 9 节测试。ROS Noetic 已于 2025-05-31 结束维护；现阶段适配既有教学平台可以继续进行，但应把 ROSBridge 和视频服务限制在本机/可信网络，并单列后续系统升级计划。[ROS PMC 公告](https://discourse.ros.org/t/ros-noetic-end-of-life-may-31-2025/43160)
