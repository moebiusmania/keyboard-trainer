import lume from "lume/mod.ts";

const site = lume({
  src: "./src",
  location: new URL("https://example.com/"),
});

// File statici: CSS vanilla e moduli JS nativi, copiati così come sono
site.add("styles");
site.add("js");
site.add("favicon.svg");
site.add("anteprima-social.png");

// Serializza dati per <script type="application/json"> senza rompere l'HTML
site.filter("json", (value: unknown) =>
  JSON.stringify(value ?? null)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026"));

// I file di solo contenuto (slide, lezioni, livelli, testi dell'interfaccia)
// sono pagine Markdown ricercabili con `search`, ma non vengono pubblicate.
site.process([".html"], (_pages, allPages) => {
  for (let i = allPages.length - 1; i >= 0; i--) {
    if (allPages[i].data.soloContenuto) allPages.splice(i, 1);
  }
});

export default site;
