export default class ShadowRootCSSPolyfill {
  static apply(element) {
    if (ShadowRoot && ShadowRoot.toString().includes("[native code]")) {
      return;
    }

    const styleElement = element.shadowRoot.querySelector("style");
    let cssString = "";

    const rules = Array.from(styleElement.sheet.cssRules);

    for (const rule of rules) {
      let selectorsString = rule.selectorText;

      const selectors = selectorsString.split(",");
      for (const selector of selectors) {
        if (selector.includes(":host")) {
          selectorsString = selectorsString.replace(":host", element.tagName);
        } else {
          selectorsString = selectorsString.replace(selector, `${element.tagName} ${selector}`);
        }
      }

      cssString += `${rule.cssText.replace(rule.selectorText, selectorsString)}\n`;
    }

    styleElement.textContent = cssString;
  }
}
