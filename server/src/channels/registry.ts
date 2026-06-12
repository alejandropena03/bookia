import { ChannelAdapter } from "./types.js";
import { MockAdapter } from "./mock.js";

const adapters = new Map<string, ChannelAdapter>();

function getAdapter(channel: string): ChannelAdapter {
  const key = channel;
  if (!adapters.has(key)) {
    switch (channel) {
      case "mock":
        adapters.set(key, new MockAdapter());
        break;
      default:
        throw new Error(`Unknown channel adapter: ${channel}`);
    }
  }
  return adapters.get(key)!;
}

export { getAdapter };
