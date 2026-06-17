// 隐私政策（中英双语）
export default function Privacy() {
  return (
    <div className="prose-cookbook mx-auto max-w-2xl">
      <h1>隐私政策 / Privacy Policy</h1>
      <p className="font-hand text-meta text-pencil/60">最后更新：2026年5月</p>

      <h2>1. 我们收集什么数据</h2>
      <ul>
        <li><strong>邮箱地址</strong>：用于登录和发送登录链接。</li>
        <li><strong>Google 账号信息</strong>：如通过 Google 登录，我们会获取你的姓名和头像（由 Google 提供）。</li>
        <li><strong>你创建的菜谱</strong>：包括菜谱标题、正文、标签、食材、版本记录、封面图片。</li>
        <li><strong>周计划数据</strong>：你安排的菜单计划。</li>
        <li><strong>个人档案</strong>：显示名称、简介（可选的）。</li>
      </ul>

      <h2>2. 数据存储在哪里</h2>
      <ul>
        <li>所有数据存储在 <strong>Supabase</strong>（PostgreSQL 数据库 + 文件存储）。</li>
        <li>Supabase 服务器位于海外（新加坡或东京）。</li>
        <li>封面图片通过 CDN 分发，全球可访问。</li>
      </ul>

      <h2>3. 第三方服务</h2>
      <ul>
        <li><strong>Supabase</strong>：提供数据库、认证、文件存储。</li>
        <li><strong>Google OAuth</strong>：提供"用 Google 登录"功能。</li>
      </ul>
      <p>我们不使用任何追踪分析工具（如 Google Analytics）。</p>

      <h2>4. 你的权利</h2>
      <ul>
        <li><strong>访问</strong>：你在应用中可以看到自己的所有数据。</li>
        <li><strong>修改</strong>：你可以随时编辑菜谱和档案。</li>
        <li><strong>导出</strong>：在"账号设置"页面，你可以导出全部数据为 JSON 文件。</li>
        <li><strong>删除</strong>：你可以删除单个菜谱，也可以永久注销账号并清除所有数据。</li>
      </ul>

      <h2>5. 数据安全</h2>
      <ul>
        <li>所有数据库操作通过行级安全策略（RLS）保护，其他用户无法访问你的数据。</li>
        <li>传输过程中的数据通过 HTTPS 加密。</li>
        <li>我们不与任何第三方分享你的数据。</li>
      </ul>

      <h2>6. 未成年人</h2>
      <p>本服务不面向未满 14 周岁的用户。如未满 14 岁，请在家长或监护人的同意下使用。</p>

      <h2>7. 联系我们</h2>
      <p>如有隐私相关问题，请联系：<a href="mailto:cookbook@lizhi.moe">cookbook@lizhi.moe</a></p>
    </div>
  );
}
