import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import * as fluentffmpeg from 'fluent-ffmpeg';
fluentffmpeg.setFfmpegPath(ffmpegPath);

export default function ffmpegResize({
    filePath,
    outputPath,
    resolution
}) {
    return new Promise((resolve, reject) => {
        fluentffmpeg(filePath)
            .output(outputPath)
            .size(resolution)
            .on('end', () => {
                resolve({});
            })
            .on('error', (err) => {
                console.error('ffmpeg error:', err);
                reject(err);
            })
            .run();
    });
}