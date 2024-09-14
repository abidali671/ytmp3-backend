const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();


const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

const rewrite = async (req, res) => {
  try {
    const type = req?.query?.type || "json";
    const language = req?.query?.language || "English";

    const prompt = `Rewrite all the given content, the words should be SEO friendly, simple, easy and like human written.
    The response should be in a ${type} format, same as content format. and the language should be ${language}.
    Note: all the text must be unique every time
    ${JSON.stringify(req.body)}
  `;

    const response = await ai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });
    res.status(200).send(response?.choices[0]?.message?.content);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = rewrite;
