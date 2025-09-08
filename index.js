// Toast UI Markdown Editor – Saltcorn Fieldview (MIT)
// WYSIWYG Markdown for String fields with soft-break → hard-break preservation

const {
  div,
  textarea,
  text,
  script,
  domReady,
} = require("@saltcorn/markup/tags");

// CDN assets
const headers = [
  {
    script: `/plugins/public/tui@${
      require("./package.json").version
    }/toastui-editor-all.min.js`,
  },
  {
    css: `/plugins/public/tui@${
      require("./package.json").version
    }/toastui-editor.min.css`,
  },
];

// Fieldview
const ToastUIMarkdownEditor = {
  name: "ToastUI Markdown Editor",
  description: "WYSIWYG Markdown editor (TOAST UI) for String fields",
  type: "String",
  isEdit: true,
  run: (nm, v, attrs, cls) => {
    const fieldName = text(nm);
    const taId = `in_${fieldName}_${Math.random().toString(36).slice(2)}`;
    const edId = `ed_${fieldName}_${Math.random().toString(36).slice(2)}`;

    const height = attrs && attrs.height ? String(attrs.height) : "320px";
    const placeholder =
      attrs && attrs.placeholder ? String(attrs.placeholder) : "";
    const hardwrap =
      attrs && typeof attrs.hardwrap === "boolean" ? attrs.hardwrap : true;

    // helper: convert soft line breaks to Markdown hard breaks (two spaces)
    const hardBreakFix = (md) => {
      if (!hardwrap) return md;
      const lines = md.split("\n");
      const out = [];
      let inCode = false;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const t = line.trim();

        if (/^```|^~~~/.test(t)) {
          inCode = !inCode;
          out.push(line);
          continue;
        }

        if (
          inCode ||
          t === "" ||
          /^[#>\-+*]\s/.test(t) ||
          /^\d+\.\s/.test(t) ||
          /^\|/.test(t)
        ) {
          out.push(line);
          continue;
        }

        // if next line exists and is a plain line too, enforce hard break
        const next = i < lines.length - 1 ? lines[i + 1].trim() : "";
        const nextIsPlain =
          next !== "" &&
          !/^[#>\-+*]\s/.test(next) &&
          !/^\d+\.\s/.test(next) &&
          !/^\|/.test(next);
        if (nextIsPlain && !/  $/.test(line)) line = line + "  ";
        out.push(line);
      }
      return out.join("\n");
    };

    return div(
      { class: cls },
      // hidden textarea carries the Markdown value
      textarea(
        { name: fieldName, id: taId, style: "display:none" },
        text(v || "")
      ),
      // visible editor
      div({ id: edId }),
      // init + sync
      script(
        domReady(`
        (function()
        {
          const ta = document.getElementById('${taId}')
          const el = document.getElementById('${edId}')
          if(!ta || !el) return

          const ed = new toastui.Editor({
            el: el,
            height: '${height}',
            initialEditType: 'wysiwyg',
            usageStatistics: false,
            hideModeSwitch: true,
            placeholder: ${JSON.stringify(placeholder)},
            initialValue: ta.value || ''
          })

          const hardwrap = ${JSON.stringify(hardwrap)}
          const hardBreakFix = ${hardBreakFix.toString()}

          const sync = () =>
          {
            const md = ed.getMarkdown()
            ta.value = hardBreakFix(md)
          }

          ed.on('change', sync)
          const form = el.closest('form')
          if(form)
          {
            form.addEventListener('submit', sync)
            form.addEventListener('reset', () =>
            {
              setTimeout(() => { ed.setMarkdown(ta.value || '') }, 0)
            })
          }
        })();
      `)
      )
    );
  },
};

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "tui",
  description:
    "WYSIWYG Markdown editor for Saltcorn String fields using TOAST UI Editor. Saves Markdown and preserves visual line breaks.",
  headers,
  fieldviews: { "toastui_markdown_edit": ToastUIMarkdownEditor },
};
