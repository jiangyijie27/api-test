const express = require("express")
const axios = require("axios")
const { Configuration, OpenAIApi } = require("openai")
const cors = require("cors")
const { encode, decode } = require("gpt-3-encoder")

const getTextFromContentObject = ({ o, divider = "" }) => {
  if (o.type === "link") {
    return o.attrs.text
  }
  if (o.type === "tags") {
    return o.attrs.dataSource.map((p) => p.text).join(divider)
  }
  if (o.type === "collapse") {
    return o.attrs.dataSource
      .map((p) => {
        return `${p.title}${getText({ value: p.panel, divider }).value}`
      })
      .join(divider)
  }
  if (o.type === "image-text") {
    return getText({ value: o.attrs.content, divider }).value
  }
  if (o.content?.length) {
    return o.content
      .map((p) => getTextFromContentObject({ o: p, divider }))
      .join(divider)
  }
  if (o.text) {
    return o.text
  }
}

const getText = ({ value: v, divider }) => {
  if (!v?.content) {
    return { type: "text", value: "" }
  }

  const { content } = v
  if (content[0].type === "branch") {
    return {
      type: "branch",
      content: content[0].attrs.dataSource.map((o) => ({
        branchId: o.id,
        title: o.title,
        value: getText({ value: o.panel, divider }),
      })),
    }
  } else {
    return {
      type: "text",
      value: content
        .map((o) => getTextFromContentObject({ o, divider }))
        .join(divider),
    }
  }
}

const constrainArticleToTokenLength = ({ article = "", maxTokens = 3700 }) => {
  const encodedLength = encode(article).length

  if (encodedLength < maxTokens) {
    return article
  }

  return constrainArticleToTokenLength({
    article: article.slice(0, (maxTokens * article.length) / encodedLength),
    maxTokens,
  })
}

const configuration = new Configuration({
  // apiKey: process.env.API_KEY,
  basePath: "https://service-3g7rfwcq-1259062116.hk.apigw.tencentcs.com/v1",
})
const openai = new OpenAIApi(configuration)

const app = express()

app.use(
  cors({
    origin: "*",
  })
)

// 获取 Access Token
// https://docs.qq.com/open/document/app/oauth2/access_token.html
app.get("/wxad-search-ai", async (req, res) => {
  const {
    question,
    cate_ids = "[]",
    prompt = "",
    temperature = 0,
    max_tokens = 100,
    top_p = 1.0,
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
  } = req.query
  // if (!prompt.trim()) {
  //   return res.status(400).send("prompt 不能为空")
  // }

  const ids = JSON.parse(cate_ids)
  console.log("yijie ids:", ids)
  // ids = [270,190,258]
  try {
    const promises = ids.map((id) => {
      return axios.get(
        `https://ad.weixin.qq.com/designapi/v1/wxad/pages?cate_id=${id}`
      )
    })
    const results = await Promise.all(promises)

    console.log("yijie 取得结果：", JSON.parse(results[0].data.data[0].release_data))

    // const articles = results
    //   .map((o) => {
    //     const data = getText({
    //       value: JSON.parse(o.data.data[0].release_data).content[0].value,
    //       divider: "\n",
    //     })
    //     if (data.type === "text") {
    //       return data.value
    //     }
    //     if (data.type === "branch") {
    //       return data.content
    //         .map((p) => {
    //           return p.value.value
    //         })
    //         .join("\n")
    //     }
    //     return ""
    //   })
    //   .join("\n\n")

    // const finalArticle = constrainArticleToTokenLength({
    //   article: articlesMock,
    // })

    // const res0 = await axios.get(
    //   `https://ad.weixin.qq.com/designapi/v1/wxad/pages?cate_id=${ids[0]}`
    // )

    // Promise all 会报错，但分开请求不会？？
    // axios
    //   .get(`https://ad.weixin.qq.com/designapi/v1/wxad/pages?cate_id=${ids[0]}`)
    //   .then((res) => {
    //     const { page_title, release_data } = res.data.data[0]
    //     articles.push({
    //       page_title,
    //       release_data,
    //     })

    //     console.log("yijie", articles)

    //     const responseData = {
    //       id: "cmpl-6wNGFFHAhFmvVF4K9aEaZcfnwneUR-test",
    //       object: "text_completion",
    //       created: 1679370459,
    //       model: "text-davinci-003",
    //       choices: [
    //         {
    //           text: "\n\n马斯克是一位美国企业家、投资家和发明家，他是特斯拉汽",
    //           index: 0,
    //           logprobs: null,
    //           finish_reason: "length",
    //         },
    //       ],
    //       usage: { prompt_tokens: 17, completion_tokens: 58, total_tokens: 75 },
    //     }
    //     response.send(responseData)
    //   })

    // console.log("yijie", res0)

    // const response = {
    //   data: {
    //     id: "cmpl-6wNGFFHAhFmvVF4K9aEaZcfnwneUR-test",
    //     object: "text_completion",
    //     created: 1679370459,
    //     model: "text-davinci-003",
    //     choices: [
    //       {
    //         text: "\n\n马斯克是一位美国企业家、投资家和发明家，他是特斯拉汽",
    //         index: 0,
    //         logprobs: null,
    //         finish_reason: "length",
    //       },
    //     ],
    //     usage: { prompt_tokens: 17, completion_tokens: 58, total_tokens: 75 },
    //   },
    // }

    // const response = await openai.createCompletion({
    //   model: "text-davinci-003",
    //   prompt: `
    //     你要扮演一个微信广告智能客服。你是热心、专业、友好的。
    //     现有用户来咨询问题，我会提供给你[参考内容]，你需要根据且仅根据[参考内容]回答问题，你只需要直接回复答案即可，不要在回答中添加任何多余的空格和换行。
    //     如果仅根据[参考内容]，你无法作答、或不确定。请直接回复：“yijie 让你换个问题”。

    //     [参考内容]：
    //     ${articles}

    //     问：${question}？
    //     答：
    //   `,
    //   temperature,
    //   max_tokens,
    //   top_p,
    //   frequency_penalty,
    //   presence_penalty,
    // })

    // console.log("yijie", response.data)
    // res.send(response.data)
  } catch (error) {
    console.log("yijie error", error)
    res.status(500).send(error.message)
  }
})

app.listen(8080, () => {
  console.log("Server listening on port 8080")
})
