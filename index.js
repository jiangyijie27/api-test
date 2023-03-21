const express = require("express")
const axios = require("axios")
const { Configuration, OpenAIApi } = require("openai")

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
  basePath: "https://service-3g7rfwcq-1259062116.hk.apigw.tencentcs.com/v1",
})
const openai = new OpenAIApi(configuration)

const app = express()

// 获取 Access Token
// https://docs.qq.com/open/document/app/oauth2/access_token.html
app.get("/wxad-design-ai", async (req, res) => {
  const {
    prompt = "",
    temperature = 0,
    max_tokens = 60,
    top_p = 1.0,
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
  } = req.query
  if (!prompt.trim()) {
    return res.status(400).send("prompt 不能为空")
  }
  try {
    // const response = await openai.createCompletion({
    //   model: "text-davinci-003",
    //   prompt,
    //   temperature,
    //   max_tokens,
    //   top_p,
    //   frequency_penalty,
    //   presence_penalty,
    // })

    const responseData = {
      id: "cmpl-6wNGFFHAhFmvVF4K9aEaZcfnwneUR-test",
      object: "text_completion",
      created: 1679370459,
      model: "text-davinci-003",
      choices: [
        {
          text: "\n\n马斯克是一位美国企业家、投资家和发明家，他是特斯拉汽",
          index: 0,
          logprobs: null,
          finish_reason: "length",
        },
      ],
      usage: { prompt_tokens: 17, completion_tokens: 58, total_tokens: 75 },
    }
    // res.send(response.data)
    res.send(responseData)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.listen(3000, () => {
  console.log("Server listening on port 3000")
})
