FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/tts-worker/package.json apps/tts-worker/package.json

RUN corepack pnpm@10.25.0 install --filter @scoop-afrique/tts-worker --frozen-lockfile

COPY apps/tts-worker apps/tts-worker

RUN corepack pnpm@10.25.0 --filter @scoop-afrique/tts-worker build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl xz-utils ffmpeg \
  && rm -rf /var/lib/apt/lists/*

ARG PIPER_VERSION=2023.11.14-2
ARG PIPER_ARCH=x86_64
RUN mkdir -p /opt/piper /opt/piper/voices \
  && curl -L "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_${PIPER_ARCH}.tar.gz" \
    | tar -xz -C /opt/piper --strip-components=1

RUN curl -L -o /opt/piper/voices/fr_FR-siwis-medium.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx \
  && curl -L -o /opt/piper/voices/fr_FR-siwis-medium.onnx.json \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json

ENV NODE_ENV=production
ENV PIPER_BINARY_PATH=/opt/piper/piper
ENV PIPER_VOICE_MODEL=/opt/piper/voices/fr_FR-siwis-medium.onnx
ENV PIPER_VOICE_CONFIG=/opt/piper/voices/fr_FR-siwis-medium.onnx.json
ENV PIPER_VOICE_NAME=fr_FR-siwis-medium
ENV TTS_AUDIO_FORMAT=mp3
ENV FFMPEG_PATH=ffmpeg

COPY --from=build /app/apps/tts-worker/dist ./dist
COPY --from=build /app/apps/tts-worker/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/tts-worker/node_modules ./node_modules

CMD ["node", "dist/index.js"]
