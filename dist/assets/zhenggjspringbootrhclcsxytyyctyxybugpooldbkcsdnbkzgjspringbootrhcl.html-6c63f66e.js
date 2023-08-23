const e=JSON.parse('{"key":"v-3155bf10","path":"/nice-article/csdn/zhenggjspringbootrhclcsxytyyctyxybugpooldbkcsdnbkzgjspringbootrhcl.html","title":"如何优雅的写 Controller 层代码？","lang":"zh-CN","frontmatter":{"title":"如何优雅的写 Controller 层代码？","shortTitle":"如何优雅的写Controller层代码？","description":"前言本篇主要要介绍的就是controller层的处理，一个完整的后端请求由4部分组成：1. 接口地址(也就是URL地址)、2. 请求方式(一般就是get、set，当然还有put、delete)、3. 请求数据(request，有head跟body)、4. 响应数据(response)本篇将解决以下3个问题：当接收到请求时，如何优雅的校验参数返回响应数据该如何统一的进行处理接收到请求，处...","tag":["正规军springboot如何处理"],"category":["CSDN"],"head":[["meta",{"name":"description","content":"前言本篇主要要介绍的就是controller层的处理，一个完整的后端请求由4部分组成：1. 接口地址(也就是URL地址)、2. 请求方式(一般就是get、set，当然还有put、delete)、3. 请求数据(request，有head跟body)、4. 响应数据(response)本篇将解决以下3个问题：当接收到请求时，如何优雅的校验参数返回响应数据该如何统一的进行处理接收到请求，处..."}],["meta",{"name":"keywords","content":"正规军springboot如何处理"}],["meta",{"property":"og:url","content":"https://javabetter.cn/nice-article/csdn/zhenggjspringbootrhclcsxytyyctyxybugpooldbkcsdnbkzgjspringbootrhcl.html"}],["meta",{"property":"og:site_name","content":"二哥的Java进阶之路"}],["meta",{"property":"og:title","content":"如何优雅的写 Controller 层代码？"}],["meta",{"property":"og:description","content":"前言本篇主要要介绍的就是controller层的处理，一个完整的后端请求由4部分组成：1. 接口地址(也就是URL地址)、2. 请求方式(一般就是get、set，当然还有put、delete)、3. 请求数据(request，有head跟body)、4. 响应数据(response)本篇将解决以下3个问题：当接收到请求时，如何优雅的校验参数返回响应数据该如何统一的进行处理接收到请求，处..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2023-04-24T02:39:04.000Z"}],["meta",{"property":"article:author","content":"沉默王二"}],["meta",{"property":"article:tag","content":"正规军springboot如何处理"}],["meta",{"property":"article:modified_time","content":"2023-04-24T02:39:04.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"如何优雅的写 Controller 层代码？\\",\\"image\\":[\\"\\"],\\"dateModified\\":\\"2023-04-24T02:39:04.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"沉默王二\\",\\"url\\":\\"/about-the-author/\\"}]}"]]},"headers":[{"level":2,"title":"一、Controller层参数接收（太基础了，可以跳过）","slug":"一、controller层参数接收-太基础了-可以跳过","link":"#一、controller层参数接收-太基础了-可以跳过","children":[]},{"level":2,"title":"二、统一状态码","slug":"二、统一状态码","link":"#二、统一状态码","children":[{"level":3,"title":"1. 返回格式","slug":"_1-返回格式","link":"#_1-返回格式","children":[]},{"level":3,"title":"2. 封装ResultVo","slug":"_2-封装resultvo","link":"#_2-封装resultvo","children":[]}]},{"level":2,"title":"三、统一校验","slug":"三、统一校验","link":"#三、统一校验","children":[{"level":3,"title":"1. 原始做法","slug":"_1-原始做法","link":"#_1-原始做法","children":[]},{"level":3,"title":"2. @Validated参数校验","slug":"_2-validated参数校验","link":"#_2-validated参数校验","children":[]},{"level":3,"title":"3. 优化异常处理","slug":"_3-优化异常处理","link":"#_3-优化异常处理","children":[]}]},{"level":2,"title":"四、统一响应","slug":"四、统一响应","link":"#四、统一响应","children":[{"level":3,"title":"1. 统一包装响应","slug":"_1-统一包装响应","link":"#_1-统一包装响应","children":[]},{"level":3,"title":"2. NOT统一响应","slug":"_2-not统一响应","link":"#_2-not统一响应","children":[]}]},{"level":2,"title":"五、统一异常","slug":"五、统一异常","link":"#五、统一异常","children":[]}],"git":{"createdTime":1658107612000,"updatedTime":1682303944000,"contributors":[{"name":"itwanger","email":"www.qing_gee@163.com","commits":8},{"name":"沉默王二","email":"www.qing_gee@163.com","commits":1}]},"readingTime":{"minutes":13.96,"words":4189},"filePathRelative":"nice-article/csdn/zhenggjspringbootrhclcsxytyyctyxybugpooldbkcsdnbkzgjspringbootrhcl.md","localizedDate":"2022年7月18日","excerpt":"<figure><img src=\\"https://cdn.tobebetterjavaer.com/tobebetterjavaer/images/nice-article/csdn-zhenggjspringbootrhclcsxytyyctyxybugpooldbkcsdnbkzgjspringbootrhcl-69c3cc92-4d31-467b-a15d-33e43fd4bade.png\\" alt=\\"\\" tabindex=\\"0\\" loading=\\"lazy\\"><figcaption></figcaption></figure>\\n<p>作者：沉默王二<br><br>\\n二哥的Java进阶之路：<a href=\\"https://javabetter.cn\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">https://javabetter.cn</a></p>"}');export{e as data};