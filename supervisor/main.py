import cv2
from ultralytics import YOLO
import supervision as sv

# Load model
model = YOLO("yolov8n.pt")

# Load video
video_path = "video.mp4"
cap = cv2.VideoCapture(video_path)

# Tracker (IMPROVED SETTINGS)
tracker = sv.ByteTrack(
    track_activation_threshold=0.35,
    lost_track_buffer=50,
    minimum_matching_threshold=0.8,
    frame_rate=30
)

# Counting logic
id_frames = {}      # how long each ID appears
counted_ids = set()
total_count = 0

# Video writer
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = int(cap.get(cv2.CAP_PROP_FPS))

out = cv2.VideoWriter(
    "output.mp4",
    cv2.VideoWriter_fourcc(*"mp4v"),
    fps,
    (640, 480)  # match resized frame
)

# Annotators
box_annotator = sv.BoxAnnotator()
label_annotator = sv.LabelAnnotator()

frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Optional frame skipping (improves stability)
    frame_count += 1
    if frame_count % 2 != 0:
        continue

    # Resize
    frame = cv2.resize(frame, (640, 480))

    # Detection
    results = model(frame)[0]

    detections = sv.Detections.from_ultralytics(results)

    # Filter persons + confidence
    detections = detections[detections.class_id == 0]
    detections = detections[detections.confidence > 0.5]

    # Tracking
    detections = tracker.update_with_detections(detections)

    # ---- SMART COUNTING ----
    for tracker_id in detections.tracker_id:
        if tracker_id is None:
            continue

        # Track visibility duration
        if tracker_id not in id_frames:
            id_frames[tracker_id] = 0

        id_frames[tracker_id] += 1

        # Count only if stable (appears in enough frames)
        if id_frames[tracker_id] > 10 and tracker_id not in counted_ids:
            counted_ids.add(tracker_id)
            total_count += 1

    # ---- DRAWING ----
    frame = box_annotator.annotate(
        scene=frame,
        detections=detections
    )

    labels = [f"ID {tracker_id}" for tracker_id in detections.tracker_id]

    frame = label_annotator.annotate(
        scene=frame,
        detections=detections,
        labels=labels
    )

    # Show count on screen
    cv2.putText(frame, f"Count: {total_count}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Save video
    out.write(frame)

    cv2.imshow("frame", frame)
    if cv2.waitKey(1) == 27:
        break

cap.release()
out.release()
cv2.destroyAllWindows()

# FINAL REPORT
print("\n===== REPORT =====")
print(f"Total Customers Detected: {total_count}")