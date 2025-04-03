import http from 'k6/http';
import { check, fail } from 'k6';

const videoFilePath = '/home/ermesom/Downloads/file_example_MP4_1920_18MG.mp4';
const uploadUrl = 'http://localhost:6000/resize';
let fileBytes;

try {
  fileBytes = open(videoFilePath, 'b');
} catch (e) {
  console.error(`Could not open file: ${videoFilePath}. Error: ${e}`);
  fail(`Failed to open file: ${videoFilePath}`);
}

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  if (fileBytes) {
    const filename = videoFilePath.split('/').pop();
    const data = {
      file: http.file(fileBytes, filename, 'video/mp4'),
      resolution: '640x480',
    };

    const params = {
      headers: {
        'User-Agent': 'insomnia/11.0.1',
      },
    };

    const res = http.post(uploadUrl, data, params);

    console.log(`VU ${__VU} ITER ${__ITER}`);

    check(res, {
      'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    });

  } else {
     console.log(`VU ${__VU} ITER ${__ITER}: Skipping request - file not loaded: ${videoFilePath}`);
  }
}
