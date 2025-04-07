import { EndpointBuilder, controller } from "./controller";
const MANIFEST_PATH = "../static/.vite/manifest.json"

export const homeIndex: EndpointBuilder = (_) => async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    const manifest = await import(MANIFEST_PATH) as any;
    res.render("index", {
      jsFile: manifest["src/main.jsx"].file,
      cssFile: manifest["src/main.jsx"].css[0],
      layout: false,
      jwt: "",
    })
  } else {
    res.render("index", {
      assetUrl: process.env.ASSET_URL,
      debug: process.env.NODE_ENV !== "production",
      layout: false,
      jwt: "",
    });
  }
}


export const HomeController = controller([
  {
    method: "get",
    path: "*",
    builder: homeIndex
  }
])