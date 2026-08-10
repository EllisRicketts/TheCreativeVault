
(function () {
  const APP_FAMILIES = [
    { title: "Adobe", text: "Photoshop, Illustrator, Premiere, After Effects, Lightroom, Firefly, Substance, Creative Cloud", countLabel: "App ecosystem" },
    { title: "Autodesk", text: "Maya, 3ds Max, Fusion 360, AutoCAD, MotionBuilder, Revit", countLabel: "App ecosystem" },
    { title: "Blackmagic", text: "DaVinci Resolve, Fusion, color grading, editing, production tools", countLabel: "App ecosystem" },
    { title: "Blender", text: "Blender, BlenderKit, Blender Market, open-source 3D tools", countLabel: "App ecosystem" },
    { title: "Unity", text: "Unity, Unity Asset Store, Unity Learn, multiplayer and game tools", countLabel: "App ecosystem" },
    { title: "Unreal", text: "Unreal Engine, Epic Games, Fab, Quixel, Megascans, MetaHuman", countLabel: "App ecosystem" },
    { title: "Godot", text: "Godot Engine, GDScript, open-source game development", countLabel: "App ecosystem" },
    { title: "Figma", text: "Figma, FigJam, plugins, UI kits, product design workflows", countLabel: "App ecosystem" },
    { title: "Canva", text: "Canva design, social content, templates, presentations, creator tools", countLabel: "App ecosystem" },
    { title: "Google", text: "YouTube, Firebase, Google Fonts, Material Design, Gemini, Maps", countLabel: "App ecosystem" },
    { title: "Microsoft", text: "GitHub, VS Code, Azure, PlayFab, Xbox, Clipchamp, Fluent Design", countLabel: "App ecosystem" },
    { title: "Maxon", text: "Cinema 4D, Redshift, ZBrush, Red Giant", countLabel: "App ecosystem" },
    { title: "OpenAI", text: "ChatGPT, OpenAI API, DALL·E, Sora, GPT workflows", countLabel: "App ecosystem" },
    { title: "Notion", text: "Notion, templates, productivity, project systems, knowledge bases", countLabel: "App ecosystem" },
    { title: "Audio", text: "DAWs, plugins, samples, sound design, mixing, mastering, music tools", countLabel: "Workflow ecosystem" }
  ];

  function ensurePanel() {
    let panel = document.getElementById("vaultApplicationsPanelV31");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "vaultApplicationsPanelV31";
      panel.className = "vault-nav-panel";
      panel.innerHTML = `
        <div class="vault-nav-panel-inner">
          <button class="vault-nav-panel-close" type="button" aria-label="Close">×</button>
          <p class="vault-nav-panel-eyebrow">THE CREATIVE VAULT</p>
          <h2>Applications</h2>
          <p class="vault-nav-panel-intro">Browse by major app ecosystems. These buttons use smart matching, so Adobe finds Photoshop, Illustrator, Premiere, After Effects, Lightroom, Firefly, Substance, and Creative Cloud resources.</p>
          <div class="vault-nav-panel-grid"></div>
        </div>
      `;

      document.body.appendChild(panel);

      panel.querySelector(".vault-nav-panel-close").addEventListener("click", function () {
        panel.classList.remove("is-open");
      });

      panel.addEventListener("click", function (event) {
        if (event.target === panel) panel.classList.remove("is-open");
      });
    }

    const grid = panel.querySelector(".vault-nav-panel-grid");
    grid.innerHTML = APP_FAMILIES.map(app => `
      <button class="vault-nav-panel-card" type="button" data-search="${app.title}" data-mode="application">
        <strong>${app.title}</strong>
        <span>${app.text}</span>
        <em>${app.countLabel}</em>
      </button>
    `).join("");

    panel.classList.add("is-open");
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-vault-nav='applications']").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        ensurePanel();
      }, true);
    });
  });
})();
