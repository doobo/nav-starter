/**
 * 导航站默认配置（用户修改后保存在 localStorage，不再使用这里的默认值）
 */
const DEFAULT_CONFIG = {
  title: '我的导航',
  defaultEngine: '360',
  news: { enabled: true, showCount: 10 },
  categories: [
    {
      name: '常用',
      links: [
        { name: '百度', url: 'https://www.baidu.com', desc: '百度一下，你就知道' },
        { name: 'Google', url: 'https://www.google.com', desc: '谷歌搜索' },
        { name: '哔哩哔哩', url: 'https://www.bilibili.com', desc: 'B站，弹幕视频' },
        { name: '知乎', url: 'https://www.zhihu.com', desc: '有问题，就会有答案' },
        { name: '微博', url: 'https://weibo.com', desc: '随时随地发现新鲜事' },
        { name: '淘宝', url: 'https://www.taobao.com', desc: '淘！我喜欢' },
        { name: '京东', url: 'https://www.jd.com', desc: '多快好省' },
        { name: '拼多多', url: 'https://www.pinduoduo.com', desc: '拼着买，才便宜' }
      ]
    },
    {
      name: '视频',
      links: [
        { name: '优酷', url: 'https://www.youku.com', desc: '这世界很酷' },
        { name: '腾讯视频', url: 'https://v.qq.com', desc: '不负好时光' },
        { name: '爱奇艺', url: 'https://www.iqiyi.com', desc: '悦享品质' },
        { name: '芒果TV', url: 'https://www.mgtv.com', desc: '天生青春' },
        { name: '西瓜视频', url: 'https://www.ixigua.com', desc: '点亮对生活的好奇心' },
        { name: '抖音', url: 'https://www.douyin.com', desc: '记录美好生活' },
        { name: '抖音视频', url: 'https://www.douyin.com', desc: '最新视频' },
        { name: '好看视频', url: 'https://haokan.baidu.com', desc: '轻松有收获' }
      ]
    },
    {
      name: '新闻',
      links: [
        { name: '人民网', url: 'http://www.people.com.cn', desc: '权威媒体' },
        { name: '新华网', url: 'http://www.xinhuanet.com', desc: '新闻门户' },
        { name: '央视网', url: 'https://www.cctv.com', desc: '中国中央电视台' },
        { name: '光明网', url: 'https://www.gmw.cn', desc: '思想理论文化' },
        { name: '新浪新闻', url: 'https://news.sina.com.cn', desc: '新浪新闻' },
        { name: '网易新闻', url: 'https://news.163.com', desc: '有态度' },
        { name: '腾讯新闻', url: 'https://news.qq.com', desc: '事实派' },
        { name: '环球网', url: 'https://www.huanqiu.com', desc: '环球视野' }
      ]
    },
    {
      name: '购物',
      links: [
        { name: '天猫', url: 'https://www.tmall.com', desc: '理想生活上天猫' },
        { name: '唯品会', url: 'https://www.vip.com', desc: '品牌特卖' },
        { name: '苏宁易购', url: 'https://www.suning.com', desc: '苏宁易购' },
        { name: '当当网', url: 'http://www.dangdang.com', desc: '图书购物' },
        { name: '闲鱼', url: 'https://www.goofish.com', desc: '闲鱼，让闲置游起来' },
        { name: '美团', url: 'https://www.meituan.com', desc: '吃喝玩乐' },
        { name: '大众点评', url: 'https://www.dianping.com', desc: '发现品质生活' },
        { name: '1688', url: 'https://www.1688.com', desc: '源头好货' }
      ]
    },
    {
      name: '学习',
      links: [
        { name: '知网', url: 'https://www.cnki.net', desc: '中国知网' },
        { name: '百度文库', url: 'https://wenku.baidu.com', desc: '文档分享平台' },
        { name: '慕课网', url: 'https://www.imooc.com', desc: '程序员的梦工厂' },
        { name: '网易公开课', url: 'https://open.163.com', desc: '中外名校公开课' },
        { name: '菜鸟教程', url: 'https://www.runoob.com', desc: '编程入门教程' },
        { name: 'MDN', url: 'https://developer.mozilla.org/zh-CN/', desc: 'Web 开发文档' },
        { name: 'LeetCode', url: 'https://leetcode.cn', desc: '力扣刷题' },
        { name: '中国大学MOOC', url: 'https://www.icourse163.org', desc: '国家精品课程' }
      ]
    },
    {
      name: '工具',
      links: [
        { name: '百度网盘', url: 'https://pan.baidu.com', desc: '云存储' },
        { name: '在线翻译', url: 'https://fanyi.baidu.com', desc: '百度翻译' },
        { name: '有道翻译', url: 'https://fanyi.youdao.com', desc: '有道翻译' },
        { name: '腾讯文档', url: 'https://docs.qq.com', desc: '在线协作文档' },
        { name: '石墨文档', url: 'https://shimo.im', desc: '在线办公' },
        { name: '印象笔记', url: 'https://www.yinxiang.com', desc: '知识管理' },
        { name: '草料二维码', url: 'https://cli.im', desc: '二维码生成器' },
        { name: '小工具合集', url: 'https://tool.lu', desc: '在线工具' }
      ]
    },
    {
      name: '技术',
      links: [
        { name: 'GitHub', url: 'https://github.com', desc: '全球最大代码托管平台' },
        { name: 'Gitee', url: 'https://gitee.com', desc: '码云，国内代码托管' },
        { name: '掘金', url: 'https://juejin.cn', desc: '技术社区' },
        { name: 'CSDN', url: 'https://www.csdn.net', desc: '技术社区' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '开发者问答' },
        { name: 'npm', url: 'https://www.npmjs.com', desc: 'JavaScript 包管理' },
        { name: 'V2EX', url: 'https://www.v2ex.com', desc: '创意工作者社区' },
        { name: '少数派', url: 'https://sspai.com', desc: '数字生活指南' }
      ]
    },
    {
      name: '生活',
      links: [
        { name: '12306', url: 'https://www.12306.cn', desc: '铁路客票' },
        { name: '携程', url: 'https://www.ctrip.com', desc: '旅行预订' },
        { name: '百度地图', url: 'https://map.baidu.com', desc: '地图导航' },
        { name: '高德地图', url: 'https://ditu.amap.com', desc: '地图导航' },
        { name: '中国天气', url: 'http://www.weather.com.cn', desc: '天气预报' },
        { name: '58同城', url: 'https://www.58.com', desc: '本地生活服务' },
        { name: '邮局快递查询', url: 'https://www.kuaidi100.com', desc: '快递查询' },
        { name: '顺丰速运', url: 'https://www.sf-express.com', desc: '顺丰快递' }
      ]
    },
    {
      name: '游戏娱乐',
      links: [
        { name: 'Steam', url: 'https://store.steampowered.com', desc: '游戏平台' },
        { name: '4399', url: 'http://www.4399.com', desc: '小游戏' },
        { name: '7k7k', url: 'http://www.7k7k.com', desc: '小游戏' },
        { name: '游民星空', url: 'https://www.gamersky.com', desc: '单机游戏门户' },
        { name: '斗鱼直播', url: 'https://www.douyu.com', desc: '游戏直播' },
        { name: '虎牙直播', url: 'https://www.huya.com', desc: '游戏直播' },
        { name: '起点中文网', url: 'https://www.qidian.com', desc: '网络小说' },
        { name: '纵横中文网', url: 'http://www.zongheng.com', desc: '网络小说' }
      ]
    },
    {
      name: '邮箱',
      links: [
        { name: '163邮箱', url: 'https://mail.163.com', desc: '网易邮箱' },
        { name: 'QQ邮箱', url: 'https://mail.qq.com', desc: 'QQ 邮箱' },
        { name: 'Gmail', url: 'https://mail.google.com', desc: '谷歌邮箱' },
        { name: 'Outlook', url: 'https://outlook.live.com', desc: '微软邮箱' },
        { name: '139邮箱', url: 'https://mail.10086.cn', desc: '移动邮箱' },
        { name: '企业微信', url: 'https://work.weixin.qq.com', desc: '企业沟通' }
      ]
    }
  ]
};

/**
 * 搜索引擎列表
 * url 中的 {q} 会被替换为搜索关键词
 */
const SEARCH_ENGINES = [
  { id: '360',    name: '360搜索',   url: 'https://www.so.com/s?q={q}' },
  { id: 'baidu',  name: '百度',      url: 'https://www.baidu.com/s?wd={q}' },
  { id: 'google', name: 'Google',    url: 'https://www.google.com/search?q={q}' },
  { id: 'bing',   name: '必应',      url: 'https://cn.bing.com/search?q={q}' },
  { id: 'sogou',  name: '搜狗',      url: 'https://www.sogou.com/web?query={q}' },
  { id: 'zhihu',  name: '知乎',      url: 'https://www.zhihu.com/search?type=content&q={q}' },
  { id: 'bilibili', name: '哔哩哔哩', url: 'https://search.bilibili.com/all?keyword={q}' },
  { id: 'douyin', name: '抖音',      url: 'https://www.douyin.com/search/{q}' },
  { id: 'taobao', name: '淘宝',      url: 'https://s.taobao.com/search?q={q}' },
  { id: 'jd',     name: '京东',      url: 'https://search.jd.com/Search?keyword={q}' },
  { id: 'github', name: 'GitHub',    url: 'https://github.com/search?q={q}' }
];

/**
 * 热点资讯数据源（按顺序尝试，取第一个成功的）
 * 均为 60s.viki.moe 的免费公开接口，支持跨域调用，由 app.js 统一规范化
 */
const NEWS_SOURCES = [
  { name: '60s读世界', url: 'https://60s.viki.moe/v2/60s' },
  { name: '抖音热点', url: 'https://60s.viki.moe/v2/douyin' }
];

/**
 * 热搜榜单模块数据源（右侧新模块，标签页切换）
 * 返回格式：data 为对象数组（title / link|url / hot_value|score）
 */
const HOT_LISTS = [
  { id: 'douyin', name: '抖音', url: 'https://60s.viki.moe/v2/douyin' },
  { id: 'toutiao', name: '头条', url: 'https://60s.viki.moe/v2/toutiao' },
  { id: 'baidu', name: '百度', url: 'https://60s.viki.moe/v2/baidu/hot' }
];

/**
 * 断网 / 接口不可用时的兜底内容：本站使用提示（不展示过期或伪造的资讯）
 */
const SITE_TIPS = [
  { title: '点击右上角 ✏️ 进入编辑模式，可增删改链接与分类', url: '', source: '使用提示' },
  { title: '搜索框左侧可切换百度 / Google / 必应等 11 个搜索引擎', url: '', source: '使用提示' },
  { title: '在 ⚙️ 设置中可修改站点名称、默认搜索引擎与主题', url: '', source: '使用提示' },
  { title: '所有配置保存在浏览器本地缓存，可导出 JSON 备份', url: '', source: '使用提示' },
  { title: '深色主题可点击右上角 🌙 / ☀️ 一键切换', url: '', source: '使用提示' },
  { title: '热点资讯每 30 分钟自动刷新，也可点击 🔄 手动刷新', url: '', source: '使用提示' },
  { title: '链接卡片悬停可查看完整网址，点击在新标签页打开', url: '', source: '使用提示' },
  { title: '导入导出配置：设置 → 导出配置 / 导入配置', url: '', source: '使用提示' }
];
