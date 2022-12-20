import { Service, Context, Session as _Session, Logger } from "koishi";

declare module "koishi" {
    interface Context {
        subscribe: Subscribe;
    }
}

export interface Config {
    biliLiveInterval?: number;
    twitterInterval?: number;
}

// 这是一个服务！
export class Subscribe extends Service {
    logger: Logger;
    timer: NodeJS.Timeout;
    timerCount: number = 0;

    biliLiveOn: boolean = false;
    //上一次更新推特的时间戳
    twitterLastUpdateTime: number = 0;

    config: Config = {
        biliLiveInterval: 1000 * 10,
        twitterInterval: 1000 * 30, // 默认 30s 查询一次，所以延迟为 0s-30s
    };

    // 服务的构造函数
    constructor(ctx: Context) {
        // 从 Service 派生子类来实现自定义服务
        super(ctx, "subscribe", false);
        // 注册日志
        this.logger = ctx.logger("subscribe");
    }

    /* 初始化 */
    // 获取目前直播开启状态，以及推文最近的更新时间
    protected async start(): Promise<void> {
        // 第一次获取直播数据
        const biliLiveInfo = await this.ctx.rss.request("/bilibili/live/room/2529408");
        const twitterInfo = await this.ctx.rss.request("/twitter/user/zhenzhengdewuwo?routeParams=exclude_rts_replies");
        const twitterInfo = await this.ctx.rss.request("/twitter/user/xiaoruan_sp?routeParams=exclude_rts_replies");

        console.log(twitterInfo);

        // 根据获取的数据，标记当前的直播状态
        if (biliLiveInfo && biliLiveInfo.item.length) this.biliLiveOn = true;

        // 根据获取到的数据，初始化时间戳
        if (twitterInfo) {
            this.twitterLastUpdateTime = new Date(twitterInfo.item[0].pubDate).valueOf();
        }

        this.logger.info("订阅服务初始化完毕");
        this.logger.info(
            `XXX Bilibili开播状态:${this.biliLiveOn ? "已开播" : "未开播"}`
        );
        this.logger.info(
            `推特上次更新时间:${new Date(this.twitterLastUpdateTime)}`
        );

        // 启动定时器，每隔一段时间重新获取一次数据
        this.timer = setInterval(async () => {
            this.handler();
        }, 1000);
    }

    /* 注销 */
    protected async stop(): Promise<void> {
        this.timerCount = 0;
        clearInterval(this.timer);
        this.logger.info("订阅服务注销完毕");
    }

    /* 处理 */
    private async handler() {
        this.timerCount++;

        // 每隔10秒，查询一次 b 站的开播状态
        if ((this.timerCount * 1000) % this.config.biliLiveInterval === 0)
            this.biliLiveHandler();
        if ((this.timerCount * 1000) % this.config.twitterInterval === 0)
            this.twitterHandler();
    }

    // /* 添加 allowPlatform 临时解决 */
    // private async broadcast(message: string, allowPlatform?: string[]) {
    //     this.ctx.bots.map((bot) => {
    //         broadcastConfigList.map(({ platform, channelId, guildId }) => {
    //             if (platform === bot.platform) {
    //                 if (!allowPlatform || allowPlatform.includes(bot.platform)) {
    //                     bot.sendMessage(channelId, message, guildId);
    //                 }
    //             }
    //         });
    //     });
    // }

    private async biliLiveHandler() {
        try {
            const liveInfo = await this.ctx.rss.request("/bilibili/live/room/2529408");

            // 如果B站开播状态不变，则返回，否则准备进行广播
            if (this.biliLiveOn === !!liveInfo.item.length) return;

            /* 准备广播 */
            if (liveInfo.item.length) {
                const msg = `B站开播辣！快去看看吧！ https://live.bilibili.com/2529408`;

                // 注意，这是向所有群组发送广播信息
                this.ctx.broadcast(msg);

                this.logger.info(`发送信息:${msg}`);
            } else {
                const msg = `B站下播`;
                this.ctx.broadcast(msg);

                this.logger.info(`发送信息:${msg}`);
            }
            this.biliLiveOn = !this.biliLiveOn;
        } catch {
            this.logger.error("biliLiveHandler error");
        }
    }

    private async twitterHandler() {
        try {
            const info = await this.ctx.rss.request("/twitter/user/zhenzhengdewuwo?routeParams=exclude_rts_replies");

            const info = await this.ctx.rss.request("/twitter/user/xiaoruan_sp?routeParams=exclude_rts_replies");

            let updateTime = new Date(info.item[0].pubDate).valueOf();

            if (updateTime > this.twitterLastUpdateTime) {
                
                const msg = JSON.stringify(info.item[0])

                this.ctx.broadcast(msg);
                this.logger.info(`发送信息:${msg}`);
                this.twitterLastUpdateTime = updateTime;
            }
        } catch {
            this.logger.error("twitterHandler error");
        }
    }
}
