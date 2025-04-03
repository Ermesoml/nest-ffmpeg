# NestJS FFMPEG Video Resizer

This project is a NestJS application that provides an API endpoint to resize video files using FFMPEG.

## Requirements

- Node.js (Used the v18.20.5 for development, but it should work with any other version above that)
- npm
- FFMPEG, but it's auto installed when running the api

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd nest-ffmpeg
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Application

### Development

To run the application in development mode with file watching:

```bash
npm run start:dev
```

The application will typically start on `http://localhost:6000`.

### Production

1.  Build the application:
    ```bash
    npm run build
    ```
2.  Start the production server:
    ```bash
    npm run start:prod
    ```

## API Endpoint

### `POST /resize`

Resizes an uploaded video file to the specified resolution.

**Request:**

-   **Method:** `POST`
-   **URL:** `/resize`
-   **Content-Type:** `multipart/form-data`
-   **Form Data:**
    -   `file`: The video file to resize.
        -   **Constraints:** Must be a video file (`video/*`), maximum size 1GB.
    -   `resolution`: The target resolution in `WIDTHxHEIGHT` format (e.g., `640x480`).
        -   **Constraints:** Must match the `^\d+x\d+$` regex pattern.

**Response:**

-   **Success (200 OK):**
    -   **Content-Type:** The MIME type of the resized video (e.g., `video/mp4`).
    -   **Content-Disposition:** `attachment; filename="<original_filename>"`
    -   **Body:** The binary content of the resized video file.
-   **Error (400 Bad Request):**
    -   If the `file` is missing, too large, not a video, or has zero size.
    -   If the `resolution` format is invalid.
-   **Error (500 Internal Server Error):**
    -   If FFMPEG encounters an error during processing.

**Example using `curl`:**

Replace `<path_to_your_video.mp4>` with the actual path to your video file.

```bash
curl -X POST http://localhost:3000/resize \
  -F "file=@<path_to_your_video.mp4>" \
  -F "resolution=640x480" \
  --output resized_video.mp4
```

This command sends the video file and the desired resolution to the `/resize` endpoint and saves the returned resized video as `resized_video.mp4`.

## Running Tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

This project is UNLICENSED.
