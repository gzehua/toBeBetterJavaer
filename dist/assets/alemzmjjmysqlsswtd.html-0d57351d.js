import{_ as t}from"./plugin-vue_export-helper-c27b6911.js";import{r as d,o as c,c as o,a as e,d as a,b as n,e as r}from"./app-1c5b5ce3.js";const l={},s=r(`<p>使用 MySQL 的过程中，大概率上都会遇到死锁问题，这实在是个令人头痛的问题。今天二哥就来对死锁进行一个详细地分析，并结合常见的死锁案例进行探讨，同时，给出一些如何去尽可能避免死锁的建议，希望能给球友们一些帮助和启发。</p><h2 id="什么是死锁" tabindex="-1"><a class="header-anchor" href="#什么是死锁" aria-hidden="true">#</a> 什么是死锁</h2><p>死锁是并发系统中一个常见的问题，同样也会出现在数据库 MySQL 的并发读写请求场景中。</p><p>当两个及以上的事务，都在等待对方释放已经持有的锁，或因为加锁顺序不一致造成循环等待锁资源的时候，就会出现“<strong>死锁</strong>”。</p><p>常见的报错信息为 <code>Deadlock found when trying to get lock...</code>。</p><p>举例来说 A 事务持有 X1 锁 ，申请 X2 锁，B 事务持有 X2 锁，申请 X1 锁。A 和 B 事务持有锁并且申请对方持有的锁进入循环等待，就造成了死锁。</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-3ccf37d0-cae4-4cb0-a11d-462be7288611.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>如上图，是右侧的四辆汽车资源请求产生了回路现象，即死循环，导致了死锁。</p><p>从死锁的定义来看，MySQL 出现死锁的几个要素为：</p><ol><li>两个或者两个以上事务</li><li>每个事务都已经持有锁并且申请新的锁</li><li>锁资源同时只能被同一个事务持有或者不兼容</li><li>事务之间因为持有锁和申请锁导致彼此循环等待</li></ol><h2 id="innodb-锁类型" tabindex="-1"><a class="header-anchor" href="#innodb-锁类型" aria-hidden="true">#</a> InnoDB 锁类型</h2><p>为了分析死锁，我们有必要对 InnoDB 的锁类型有一个了解。</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-da7199f3-0ed4-4e01-825e-8f5f54cb4926.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>MySQL InnoDB 引擎实现了标准的<code>行级别锁：共享锁( S lock ) 和排他锁 ( X lock )</code></p><ol><li>不同事务可以同时对同一行记录加 S 锁。</li><li>如果一个事务对某一行记录加 X 锁，其他事务就不能加 S 锁或者 X 锁，从而导致锁等待。</li></ol><p>如果事务 T1 持有行 r 的 S 锁，那么另一个事务 T2 请求 r 的锁时，会做如下处理:</p><ol><li>T2 请求 S 锁立即被允许，结果 T1 T2 都持有 r 行的 S 锁</li><li>T2 请求 X 锁不能被立即允许</li></ol><p>如果 T1 持有 r 的 X 锁，那么 T2 请求 r 的 X、S 锁都不能被立即允许，T2 必须等待 T1 释放 X 锁才可以，因为 X 锁与任何的锁都不兼容。</p><p>共享锁和排他锁的兼容性如下所示：</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-da39b1a9-110e-4649-869a-a54e1d449973.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><h2 id="间隙锁-gap-lock" tabindex="-1"><a class="header-anchor" href="#间隙锁-gap-lock" aria-hidden="true">#</a> 间隙锁( gap lock )</h2><p>间隙锁锁住一个间隙以防止插入。假设索引列有 2, 4, 8 三个值，如果对 4 加锁，那么同时也会对(2,4)和(4,8)这两个间隙加锁。其他事务无法插入索引值在这两个间隙之间的记录。但是，间隙锁有个例外:</p><ol><li>如果索引列是唯一索引，那么只会锁住这条记录(只加行锁)，而不会锁住间隙。</li><li>对于联合索引且是唯一索引，如果 where 条件只包括联合索引的一部分，那么依然会加间隙锁。</li></ol><h2 id="next-key-lock" tabindex="-1"><a class="header-anchor" href="#next-key-lock" aria-hidden="true">#</a> next-key lock</h2><p>next-key lock 实际上就是 行锁+这条记录前面的 gap lock 的组合。假设有索引值 10,11,13 和 20，那么可能的 next-key lock 包括:</p><blockquote><p>(负无穷,10],(10,11],(11,13],(13,20],(20,正无穷)</p></blockquote><p>在 RR 隔离级别下，InnoDB 使用 next-key lock 主要是防止<code>幻读</code>问题产生。</p><h2 id="意向锁-intention-lock" tabindex="-1"><a class="header-anchor" href="#意向锁-intention-lock" aria-hidden="true">#</a> 意向锁( Intention lock )</h2><p>InnoDB 为了支持多粒度的加锁，允许行锁和表锁同时存在。为了支持在不同粒度上的加锁操作，InnoDB 支持了额外的一种锁方式，称之为意向锁( Intention Lock )。意向锁是将锁定的对象分为多个层次，意向锁意味着事务希望在更细粒度上进行加锁。意向锁分为两种:</p><ol><li>意向共享锁( IS )：事务有意向对表中的某些行加共享锁</li><li>意向排他锁( IX )：事务有意向对表中的某些行加排他锁</li></ol><p>由于 InnoDB 存储引擎支持的是行级别的锁，因此意向锁其实不会阻塞除全表扫描以外的任何请求。表级意向锁与行级锁的兼容性如下所示:</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-208eaa9b-5d8e-48c8-a39c-2b4c881ec8f9.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><h2 id="插入意向锁-insert-intention-lock" tabindex="-1"><a class="header-anchor" href="#插入意向锁-insert-intention-lock" aria-hidden="true">#</a> 插入意向锁( Insert Intention lock )</h2><p>插入意向锁是在插入一行记录操作之前设置的一种间隙锁，这个锁释放了一种插入方式的信号，即多个事务在相同的索引间隙插入时如果不是插入间隙中相同的位置就不需要互相等待。假设某列有索引值 2，6，只要两个事务插入位置不同(如事务 A 插入 3，事务 B 插入 4)，那么就可以同时插入。</p><h2 id="锁模式兼容矩阵" tabindex="-1"><a class="header-anchor" href="#锁模式兼容矩阵" aria-hidden="true">#</a> 锁模式兼容矩阵</h2><p>横向是已持有锁，纵向是正在请求的锁：</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-a85d87df-ace5-4827-a7c6-ac8c4c38d8fd.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><h2 id="阅读死锁日志" tabindex="-1"><a class="header-anchor" href="#阅读死锁日志" aria-hidden="true">#</a> 阅读死锁日志</h2><p>在进行具体案例分析之前，咱们先了解下如何去读懂死锁日志，尽可能地使用死锁日志里面的信息来帮助我们来解决死锁问题。</p><p>后面测试用例的数据库场景如下:<code>MySQL 5.7 事务隔离级别为 RR</code>。</p><p>表结构和数据如下:</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-cb2e7966-e318-4598-8392-0c85f2fb3bf0.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>测试用例如下:</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-abd2fc8c-3a5b-4ecd-a2dd-28167b697465.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>通过执行 <code>show engine innodb status</code> 可以查看到最近一次死锁的日志。</p><h2 id="日志分析如下" tabindex="-1"><a class="header-anchor" href="#日志分析如下" aria-hidden="true">#</a> 日志分析如下:</h2><ol><li><code>(1) TRANSACTION: TRANSACTION 2322, ACTIVE 6 sec starting index read</code></li></ol><p>事务号为 2322，活跃 6 秒，starting index read 表示事务状态为根据索引读取数据。常见的其他状态有:</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-81e70574-3fb0-4066-97fa-c1e48fc136c7.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p><code>mysql tables in use 1</code> 说明当前的事务使用一个表。</p><p><code>locked 1</code> 表示表上有一个表锁，对于 DML 语句为 LOCK_IX</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>LOCK WAIT 2 lock struct(s), heap size 1136, 1 row lock(s)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p><code>LOCK WAIT</code> 表示正在等待锁，<code>2 lock struct(s)</code> 表示 trx-&gt;trx_locks 锁链表的长度为 2，每个链表节点代表该事务持有的一个锁结构，包括表锁，记录锁以及自增锁等。本用例中 2locks 表示 IX 锁和 lock_mode X (Next-key lock)</p><p><code>1 row lock(s)</code> 表示当前事务持有的行记录锁/ gap 锁的个数。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>MySQL thread id 37, OS thread handle 140445500716800, query id 1234 127.0.0.1 root updating
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p><code>MySQL thread id 37</code> 表示执行该事务的线程 ID 为 37 (即 show processlist; 展示的 ID )</p><p><code>delete from student where stuno=5</code> 表示事务 1 正在执行的 sql，比较难受的事情是 <code>show engine innodb status</code> 是查看不到完整的 sql 的，通常显示当前正在等待锁的 sql。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>(1) WAITING FOR THIS LOCK TO BE GRANTED:

RECORD LOCKS space id 11 page no 5 n bits 72 index idx_stuno of table cw.student trx id 2322 lock_mode X waiting
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>RECORD LOCKS 表示记录锁， 此条内容表示事务 1 正在等待表 student 上的 idx_stuno 的 X 锁，本案例中其实是 Next-Key Lock 。</p><p>事务 2 的 log 和上面分析类似:</p><ol start="2"><li><code>(2) HOLDS THE LOCK(S):</code></li></ol><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>RECORD LOCKS space id 11 page no 5 n bits 72 index idx_stuno of table cw. student trx id 2321 lock_mode X
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>显示事务 2 的 <code>insert into student(stuno,score) values(2,10)</code> 持有了 a=5 的 <code>Lock mode X | LOCK_gap</code>，不过我们从日志里面看不到事务 2 执行的 <code>delete from student where stuno=5;</code></p><p>这点也是造成 DBA 仅仅根据日志难以分析死锁的问题的根本原因。</p><ol start="3"><li><code>(2) WAITING FOR THIS LOCK TO BE GRANTED:</code></li></ol><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>RECORD LOCKS space id 11 page no 5 n bits 72 index idx_stuno of table cw\\***\\*.\\*\\***student trx id 2321 lock_mode X locks gap before rec insert intention waiting
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>表示事务 2 的 insert 语句正在等待插入意向锁 <code>lock_mode X locks gap before rec insert intention waiting ( LOCK_X + LOCK_REC_gap )</code></p><h2 id="经典案例分析" tabindex="-1"><a class="header-anchor" href="#经典案例分析" aria-hidden="true">#</a> 经典案例分析</h2><h2 id="案例一-事务并发-insert-唯一键冲突" tabindex="-1"><a class="header-anchor" href="#案例一-事务并发-insert-唯一键冲突" aria-hidden="true">#</a> 案例一:事务并发 insert 唯一键冲突</h2><p>表结构和数据如下所示:</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-cd2175f3-5ed0-406a-97c8-e328b42fa9f3.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-54eda565-e156-445a-8577-7c7e5dac4cdc.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>测试用例如下:</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-1cad4c4e-ff19-4bea-b4ba-0e83ff206d6a.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>日志分析如下:</p><ol><li>事务 T2 <code>insert into t7(id,a) values (26,10)</code> 语句 insert 成功，持有 a=10 的 <code>排他行锁( Xlocks rec but no gap )</code></li><li>事务 T1 <code>insert into t7(id,a) values (30,10)</code>, 因为 T2 的第一条 insert 已经插入 a=10 的记录,事务 T1 insert a=10 则发生唯一键冲突,需要申请对冲突的唯一索引加上 S Next-key Lock( 即 lock mode S waiting ) 这是一个<code>间隙锁</code>会申请锁住(,10],(10,20]之间的 gap 区域。</li><li>事务 T2 <code>insert into t7(id,a) values (40，9)</code>该语句插入的 a=9 的值在事务 T1 申请的 <code>gap 锁4-10之间</code>， 故需事务 T2 的第二条 insert 语句要等待事务 T1 的 <code>S-Next-key Lock 锁</code>释放,在日志中显示 <code>lock_mode X locks gap before rec insert intention waiting</code> 。</li></ol><h2 id="案例二-先-update-再-insert-的并发死锁问题" tabindex="-1"><a class="header-anchor" href="#案例二-先-update-再-insert-的并发死锁问题" aria-hidden="true">#</a> 案例二:先 update 再 insert 的并发死锁问题</h2><p>表结构如下，无数据:</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-2fb97adc-0ccc-4111-9f24-548b5640b418.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>测试用例如下:</p><figure><img src="https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/weixin-alemzmjjmysqlsswtd-e79b54b9-f67c-4391-aa89-43463987529a.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>死锁分析:</p><p>可以看到两个事务 update 不存在的记录，先后获得<code>间隙锁( gap 锁)</code>，gap 锁之间是兼容的所以在 update 环节不会阻塞。两者都持有 gap 锁，然后去竞争插入<code>意向锁</code>。当存在其他会话持有 gap 锁的时候，当前会话申请不了插入意向锁，导致死锁。</p><h2 id="如何尽可能避免死锁" tabindex="-1"><a class="header-anchor" href="#如何尽可能避免死锁" aria-hidden="true">#</a> 如何尽可能避免死锁</h2><ol><li>合理的设计索引，区分度高的列放到组合索引前面，使业务 SQL 尽可能通过索引<code>定位更少的行，减少锁竞争</code>。</li><li>调整业务逻辑 SQL 执行顺序， 避免 update/delete 长时间持有锁的 SQL 在事务前面。</li><li>避免<code>大事务</code>，尽量将大事务拆成多个小事务来处理，小事务发生锁冲突的几率也更小。</li><li>以<code>固定的顺序</code>访问表和行。比如两个更新数据的事务，事务 A 更新数据的顺序为 1，2;事务 B 更新数据的顺序为 2，1。这样可能会造成死锁。</li><li>在并发比较高的系统中，不要显式加锁，特别是是在事务里显式加锁。如 <code>select … for update</code> 语句，如果是在事务里<code>（运行了 start transaction 或设置了autocommit 等于0）</code>,那么就会锁定所查找到的记录。</li><li>尽量按<code>主键/索引</code>去查找记录，范围查找增加了锁冲突的可能性，也不要利用数据库做一些额外额度计算工作。比如有的程序会用到 “<code>select … where … order by rand();</code>”这样的语句，由于类似这样的语句用不到索引，因此将导致整个表的数据都被锁住。</li><li>优化 SQL 和表设计，减少同时占用太多资源的情况。比如说，<code>减少连接的表</code>，将复杂 SQL <code>分解</code>为多个简单的 SQL。</li></ol><p>以上，希望能给球友们一些帮助。</p>`,86),p={href:"https://mp.weixin.qq.com/s?__biz=MzAwMDg2OTAxNg==&mid=2652056181&idx=1&sn=ef983612c4323bbd94929886ff564be6&chksm=8105dd82b67254945335a88cbfdab0a593f40a35ed333c8aa790a0af2b338fa5edbce78a4c00#rd",target:"_blank",rel:"noopener noreferrer"};function g(b,m){const i=d("ExternalLinkIcon");return c(),o("div",null,[s,e("blockquote",null,[e("p",null,[a("参考链接："),e("a",p,[a("https://mp.weixin.qq.com/s?__biz=MzAwMDg2OTAxNg==&mid=2652056181&idx=1&sn=ef983612c4323bbd94929886ff564be6&chksm=8105dd82b67254945335a88cbfdab0a593f40a35ed333c8aa790a0af2b338fa5edbce78a4c00#rd"),n(i)])])])])}const u=t(l,[["render",g],["__file","alemzmjjmysqlsswtd.html.vue"]]);export{u as default};