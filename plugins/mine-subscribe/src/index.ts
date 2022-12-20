import { Context, Schema } from 'koishi'
import { RSS } from "./service/rsshub"
import { Subscribe } from "./service/subscribe"

export const name = 'mine-subscribe'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // write your plugin here
  ctx.using(["database"], (ctx) => {
    ctx.plugin(RSS);
  });
  ctx.using(["rss"], (ctx) => {
    ctx.plugin(Subscribe);
  });
}
