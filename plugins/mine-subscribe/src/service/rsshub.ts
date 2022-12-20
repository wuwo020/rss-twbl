import { Service, Context, Session as _Session, Logger } from "koishi";
import RSSHub from "rsshub";

declare module "koishi" {
  interface Context {
    rss: RSS;
  }
}

interface RequestResult {
  title: string;
  item: {
    title: string;
    author: string;
    description: string;
    pubDate: string;
    link: string;
  }[];
}

export class RSS extends Service {
  logger: Logger;

  constructor(ctx: Context) {
    super(ctx, "rss", false);
    this.logger = ctx.logger("rss");
  }

  protected start() {
    RSSHub.init({
      CACHE_TYPE: null,
      CACHE_EXPIRE: 0,
      LOGGER_LEVEL: "emerg",
      PROXY_URI: "socks5h://127.0.0.1:7890" //设置代理
    });
    this.logger.info("RSS服务初始化完毕");
  }

  protected stop() {
    this.logger.info("RSS服务注销完毕");
  }

  async request(path: string): Promise<RequestResult> {
    return RSSHub.request(path).then((res) => {
      return res;
    }) as Promise<RequestResult>;
  }
}
