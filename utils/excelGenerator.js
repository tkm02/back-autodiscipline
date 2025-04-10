const ExcelJS = require("exceljs");

// Fonction pour générer un rapport Excel
exports.generateExcelReport = async (objectifs) => {
  const workbook = new ExcelJS.Workbook();

  // Ajouter une feuille pour le résumé
  const resumeSheet = workbook.addWorksheet("Résumé");

  // En-têtes du résumé
  resumeSheet.columns = [
    { header: "Catégorie", key: "categorie", width: 15 },
    { header: "Nombre d'objectifs", key: "nombre", width: 20 },
    { header: "Taux de complétion", key: "taux", width: 20 },
  ];

  // Styliser les en-têtes
  const headerRow = resumeSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Calculer les statistiques par catégorie
  const stats = {
    spirituel: { nombre: 0, completes: 0, total: 0 },
    professionnel: { nombre: 0, completes: 0, total: 0 },
    personnel: { nombre: 0, completes: 0, total: 0 },
  };

  objectifs.forEach((obj) => {
    stats[obj.categorie].nombre++;

    // Calculer le taux de complétion pour les 7 derniers jours
    const aujourdhui = new Date();
    let joursCompletes = 0;
    let joursTrackes = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(aujourdhui);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      if (obj.progression[dateStr] !== undefined) {
        joursTrackes++;

        if (obj.typeDeTracking === "binaire") {
          if (obj.progression[dateStr] === true) {
            joursCompletes++;
          }
        } else {
          if (obj.progression[dateStr] > 0) {
            joursCompletes++;
          }
        }
      }
    }

    stats[obj.categorie].completes += joursCompletes;
    stats[obj.categorie].total += joursTrackes;
  });

  // Ajouter les données au résumé
  Object.keys(stats).forEach((categorie) => {
    const taux = stats[categorie].total > 0 ? (stats[categorie].completes / stats[categorie].total) * 100 : 0;

    resumeSheet.addRow({
      categorie:
        categorie === "spirituel" ? "Spirituel" : categorie === "professionnel" ? "Professionnel" : "Personnel",
      nombre: stats[categorie].nombre,
      taux: `${taux.toFixed(2)}%`,
    });
  });

  // Ajouter une feuille pour chaque catégorie
  const categories = ["spirituel", "professionnel", "personnel"];

  categories.forEach((categorie) => {
    const objectifsCategorie = objectifs.filter((obj) => obj.categorie === categorie);

    if (objectifsCategorie.length === 0) return;

    const aujourdhui = new Date();
    const last7DaysHeaders = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(aujourdhui);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      last7DaysHeaders.push({ header: dateStr, key: `jour${i}`, width: 12 });
    }

    const sheet = workbook.addWorksheet(
      categorie === "spirituel"
        ? "Objectifs Spirituels"
        : categorie === "professionnel"
        ? "Objectifs Professionnels"
        : "Objectifs Personnels"
    );

    // En-têtes
    sheet.columns = [
      { header: "Nom", key: "nom", width: 30 },
      { header: "Type", key: "type", width: 15 },
      { header: "Fréquence", key: "frequence", width: 15 },
      { header: "Cible", key: "cible", width: 10 },
      { header: "Description", key: "description", width: 40 },
      ...last7DaysHeaders, // Ajouter les colonnes pour les 7 derniers jours
    ];

    // Styliser les en-têtes
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Ajouter les données
    objectifsCategorie.forEach((obj) => {
      const row = {
        nom: obj.nom,
        type:
          obj.typeDeTracking === "binaire" ? "Binaire" : obj.typeDeTracking === "compteur" ? "Compteur" : "Numérique",
        frequence:
          obj.frequence === "quotidien"
            ? "Quotidienne"
            : obj.frequence === "hebdomadaire"
            ? "Hebdomadaire"
            : "Mensuelle",
        cible: obj.cible || "",
        description: obj.description || "",
      };

      // Ajouter les valeurs pour les 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const date = new Date(aujourdhui);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        if (obj.progression[dateStr] !== undefined) {
          if (obj.typeDeTracking === "binaire") {
            row[`jour${i}`] = obj.progression[dateStr] ? "Oui" : "Non";
          } else {
            row[`jour${i}`] = obj.progression[dateStr];
          }
        } else {
          row[`jour${i}`] = "-";
        }
      }

      sheet.addRow(row);
    });
  });

  // Générer le buffer
  return await workbook.xlsx.writeBuffer();
}; 