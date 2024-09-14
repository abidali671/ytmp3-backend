const PageModel = require("../models/Pages.model");
const SettingModel = require("../models/Setting.model");

const createPage = async (req, res) => {
  try {
    const page = new PageModel(req.body);
    await page.save();

    res.status(200).send({ pageId: page._id });
  } catch (error) {
    res.status(500).send(error);
  }
};

const editPage = async (req, res) => {
  try {
    const { type, code } = req.params;

    const page = await PageModel.findOneAndUpdate(
      { type },
      { [code]: req.body }
    );

    if (req?.body?.slug && page[code]?.slug !== req?.body?.slug) {
      const pages = await PageModel.find({}, { _id: 0, __v: 0 }).lean();
      const targetHref = `${process.env.NEXT_PUBLIC_BASE_URL}/${
        page[code]?.slug === "/" ? "" : page[code]?.slug
      }`;
      const newHref = `${process.env.NEXT_PUBLIC_BASE_URL}/${
        req.body?.slug === "/" ? "" : req.body?.slug
      }`;

      const checkHomePageForLink = (tag) =>
        tag.includes("<link") &&
        (tag.includes('rel="alternate"') ||
          tag.includes(`rel='alternate'`) ||
          tag.includes('rel="canonical"') ||
          tag.includes(`rel='canonical'`)) &&
        (tag.includes(`href="${targetHref}"`) ||
          tag.includes(`href='${targetHref}'`));

      const checkHomePageForMeta = (tag) =>
        tag.includes("<meta") &&
        (tag.includes('property="og:url"') ||
          tag.includes(`property='og:url'`) ||
          tag.includes('name="twitter:url"') ||
          tag.includes(`name='twitter:url'`)) &&
        (tag.includes(`content="${targetHref}"`) ||
          tag.includes(`content='${targetHref}'`));

      const isHomePageChangeable = (tag) =>
        checkHomePageForLink(tag) || checkHomePageForMeta(tag);

      const checkOtherPageForLink = (tag) =>
        tag.includes("<link") &&
        (tag.includes('rel="alternate"') ||
          tag.includes(`rel='alternate'`) ||
          tag.includes('rel="canonical"') ||
          tag.includes(`rel='canonical'`)) &&
        (tag.includes(`href="${targetHref}/${type}`) ||
          tag.includes(`href='${targetHref}/${type}`));

      const checkOtherPageForMeta = (tag) => {
        return (
          tag.includes("<meta") &&
          (tag.includes('property="og:url"') ||
            tag.includes(`property='og:url'`) ||
            tag.includes('name="twitter:url"') ||
            tag.includes(`name='twitter:url'`)) &&
          (tag.includes(`content="${targetHref}/${type}`) ||
            tag.includes(`content='${targetHref}/${type}`))
        );
      };

      const isOtherPageChangeable = (tag) =>
        checkOtherPageForLink(tag) || checkOtherPageForMeta(tag);

      const changeData = pages.map(async (pageData) => {
        const oldPage = { ...pageData };
        const { type: pageType, ...languages } = oldPage;

        Object.keys(languages).forEach((language) => {
          const metaTagList = oldPage?.[language]?.metaTags?.split("\n");
          const newMetaTagList = metaTagList?.map((tag) => {
            if (type === "home" && isHomePageChangeable(tag)) {
              return tag
                .replace(`href="${targetHref}"`, `href="${newHref}"`)
                .replace(`href='${targetHref}'`, `href='${newHref}'`)
                .replace(`content="${targetHref}"`, `content="${newHref}"`)
                .replace(`content='${targetHref}'`, `content='${newHref}'`);
            } else if (type !== "home" && isOtherPageChangeable(tag)) {
              return tag
                .replace(`href="${targetHref}`, `href="${newHref}`)
                .replace(`href='${targetHref}`, `href='${newHref}`)
                .replace(`content="${targetHref}"`, `content="${newHref}"`)
                .replace(`content='${targetHref}'`, `content='${newHref}'`);
            } else return tag;
          });
          if (newMetaTagList?.length > 0 && typeof newMetaTagList === "object")
            oldPage[language].metaTags = newMetaTagList?.join("\n");
        });

        await PageModel.findOneAndUpdate({ type: pageType }, oldPage);
      });

      await Promise.all(changeData);
    }

    const currentPageData = await PageModel.findOne({ type }, { [code]: 1 });

    res.status(200).send(currentPageData[code]);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getPage = async (req, res) => {
  try {
    const { type, code } = req.params;
    const page = await PageModel.findOne({ type }, { [code]: 1, _id: 1 });

    res.status(200).send({ ...page?.[code], pageId: page?._id } ?? {});
  } catch (error) {
    res.status(500).send(error);
  }
};

const getPageSlug = async (req, res) => {
  try {
    const { type } = req.params;
    const setting = await SettingModel.findOne();
    const page = await PageModel.findOne(
      { type },
      { type: 0, __v: 0, _id: 0 }
    ).lean();

    const slugs =
      Object.keys(page)?.map?.((code) => ({
        slug: page?.[code]?.slug + (setting?.globalSlug || ""),
        code,
      })) ?? [];

    res.status(200).send(slugs);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = { createPage, editPage, getPage, getPageSlug };
