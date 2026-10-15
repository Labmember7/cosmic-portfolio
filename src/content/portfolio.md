---
brand:
  name: "Bacem Zarai"
  tagline: "embedded · robotics · vision"
  description: "Engineering the interface between silicon and perception — building autonomous systems that see, decide, and act."
  email: "basemzarai@gmail.com"
  linkedin: "https://www.linkedin.com/in/zaraibacem/"
  github: "https://github.com/Labmember7"

# experiences: planets along the corridor BEFORE the wormhole.
#   place — short company / city name shown BIG on the planet (the "cool" headline)
#   name  — role / job title shown below
#   year  — date label
#   color/accent/pattern — planet look (patterns: grid, stripes, gas, ice, lava)
#   z     — OPTIONAL. Leave it out and the engine auto-spaces planets every 30 units;
#           adding more experiences will push the wormhole + galaxy further back,
#           so new planets never appear past it.
experiences:
  - place: "Siemens"
    name: "IoT Engineer"
    year: "2022"
    description: "Built secure MQTT pipelines and edge gateways connecting thousands of industrial sensors to Azure IoT Hub."
    color: "#3da9ff"
    accent: "#06203d"
    pattern: "grid"
  - place: "INRIA Lab"
    name: "AI Research Intern"
    year: "2023"
    description: "Researched self-supervised vision transformers for robotic perception, publishing internal benchmarks on novel pretext tasks."
    color: "#af52ff"
    accent: "#2a0a4a"
    pattern: "gas"
  - place: "Boston Dynamics"
    name: "Robotics Engineer"
    year: "2024 → now"
    description: "Shipping locomotion and manipulation stacks for quadruped fleets — from low-level controllers to onboard perception."
    color: "#ff7a18"
    accent: "#3a1500"
    pattern: "stripes"

# Add as many experiences (and projects) as you like — they'll be laid out
# dynamically and the wormhole / galaxy will shift behind them automatically.

projects:
  - name: "Vision Rig"
    color: "#3cf0a0"
    accent: "#0a3b2a"
    desc: "Edge real-time detection"
    details: "A custom multi-camera rig running YOLO + custom CNNs on a Jetson Orin for sub-30ms latency."
    stack: ["Jetson Orin", "OpenCV", "TensorRT", "C++"]
    pattern: "grid"
    radius: 5
    speed: 0.18
    size: 0.95

  - name: "Swarm Robotics"
    color: "#7fd1ff"
    accent: "#0b2a4a"
    desc: "ROS2 multi-agent navigation"
    details: "Decentralized planner for 6 ground rovers using ROS2 + behavior trees and a shared occupancy map."
    stack: ["ROS2", "Nav2", "Python", "Gazebo"]
    pattern: "ice"
    radius: 8
    speed: 0.12
    size: 1.1

  - name: "Industrial IoT"
    color: "#ffd23c"
    accent: "#5a3a00"
    desc: "LoRa mesh + dashboards"
    details: "End-to-end LoRaWAN sensor network for a factory floor: 80+ nodes, MQTT bridge, time-series dashboards."
    stack: ["LoRaWAN", "MQTT", "InfluxDB", "Grafana"]
    pattern: "stripes"
    radius: 11
    speed: 0.09
    size: 1.25

  - name: "ML Inspection"
    color: "#ff7ac6"
    accent: "#4a0a2a"
    desc: "Production-line vision model"
    details: "Defect-detection model deployed on the line: synthetic data augmentation, 99.2% recall on critical defects."
    stack: ["PyTorch", "CUDA", "ONNX", "Docker"]
    pattern: "gas"
    radius: 14
    speed: 0.07
    size: 1.0

  - name: "Embedded RTOS"
    color: "#ff8a3c"
    accent: "#5a1a00"
    desc: "STM32 motor control firmware"
    details: "FreeRTOS firmware driving a 3-axis BLDC actuator with CAN bus telemetry and field-oriented control."
    stack: ["STM32", "FreeRTOS", "C", "CAN"]
    pattern: "lava"
    radius: 17
    speed: 0.05
    size: 1.15

skills:
  technical:
    - "C / C++"
    - "Python"
    - "ROS"
    - "OpenCV"
    - "PyTorch"
    - "STM32"
    - "Linux"
    - "Docker"
    - "CUDA"
    - "Git"
  soft:
    - "Leadership"
    - "Communication"
    - "Problem Solving"
    - "Teamwork"
    - "Adaptability"

# certifications + achievements rendered as orbiting medals in "The Pantheon" scene
achievements:
  - name: "NVIDIA Jetson AI Specialist"
    issuer: "NVIDIA DLI"
    year: "2024"
    icon: "◆"
    color: "#76ff7a"
    accent: "#0a3b1f"
    description: "Edge AI deployment on Jetson hardware."
  - name: "ROS 2 Developer"
    issuer: "The Construct"
    year: "2023"
    icon: "✦"
    color: "#7fd1ff"
    accent: "#0b2a4a"
    description: "Multi-robot navigation & behavior trees."
  - name: "Deep Learning Specialization"
    issuer: "DeepLearning.AI"
    year: "2022"
    icon: "⬢"
    color: "#c89bff"
    accent: "#2a0a4a"
    description: "Five-course CNN, RNN & sequence models track."
  - name: "AWS IoT Core"
    issuer: "Amazon Web Services"
    year: "2022"
    icon: "▲"
    color: "#ffd27a"
    accent: "#5a3a00"
  - name: "Embedded C++ Mastery"
    issuer: "ARM Education"
    year: "2021"
    icon: "✺"
    color: "#ff7ac6"
    accent: "#4a0a2a"
  - name: "RoboCup Junior Champion"
    issuer: "RoboCup"
    year: "2020"
    icon: "★"
    color: "#ff8a3c"
    accent: "#5a1a00"
    description: "1st place — autonomous rescue rover."
---

# A Cosmic Journey

Edit the YAML above to change every piece of content in the 3D portfolio.
Add more entries to `experiences:` or `projects:` and the scene re-lays out
automatically — the wormhole, galaxy, skill constellation and final black hole
all shift further back so new experience planets stay BEFORE the wormhole.
