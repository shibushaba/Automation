from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import Response
from PIL import Image
from io import BytesIO

app = FastAPI()

# BOX COORDINATES (LOCKED)
BEFORE_BOX = (130, 311, 534, 393)
AFTER_BOX  = (420, 775, 534, 393)



def fit_inside_box(img, box_w, box_h):
    img_ratio = img.width / img.height
    box_ratio = box_w / box_h

    if img_ratio > box_ratio:
        new_w = box_w
        new_h = int(box_w / img_ratio)
    else:
        new_h = box_h
        new_w = int(box_h * img_ratio)

    return img.resize((new_w, new_h), Image.LANCZOS)

@app.post("/generate")
async def generate_image(
    before: UploadFile = File(...),
    after: UploadFile = File(...),
    amount: str = Form(...),
    mail: str = Form(...)
):
    # Read images
    before_img = Image.open(BytesIO(await before.read())).convert("RGBA")
    after_img  = Image.open(BytesIO(await after.read())).convert("RGBA")

    # Load template
    template = Image.open("template.png").convert("RGBA")

    # Resize
    before_img = fit_inside_box(before_img, BEFORE_BOX[2], BEFORE_BOX[3])
    after_img  = fit_inside_box(after_img, AFTER_BOX[2], AFTER_BOX[3])

    # Center
    bx, by, bw, bh = BEFORE_BOX
    ax, ay, aw, ah = AFTER_BOX

    template.paste(
        before_img,
        (bx + (bw - before_img.width)//2, by + (bh - before_img.height)//2),
        before_img
    )

    template.paste(
        after_img,
        (ax + (aw - after_img.width)//2, ay + (ah - after_img.height)//2),
        after_img
    )

    # Output image
    buffer = BytesIO()
    template.convert("RGB").save(buffer, format="PNG")
    buffer.seek(0)

    return Response(
        content=buffer.read(),
        media_type="image/png",
        headers={
            "X-Mail": mail,
            "X-Amount": amount
        }
    )
