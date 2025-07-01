let woorden = [];
let huidigeIndex = 0;
let huidigeWoord = "";
let blanks = [];
let keuzesIndex = 0;
let foutenLijst = [];
let knoppenGebruikt = false;

document.addEventListener("DOMContentLoaded", () => {
    const uploadInput = document.getElementById("bestand-upload");

    uploadInput.addEventListener("change", (event) => {
        const bestand = event.target.files[0];
        if (!bestand) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: ["woord", "commentaar"], defval: "" });
            woorden = json.filter(row => row.woord);
            startSpel();
        };
        reader.onerror = function (err) {
            document.getElementById("woord-container").innerText = "Fout bij inlezen van bestand.";
            console.error(err);
        };
        reader.readAsArrayBuffer(bestand);
    });
});

function startSpel() {
    huidigeIndex = 0;
    foutenLijst = [];
    woorden = woorden.sort(() => Math.random() - 0.5);
    document.getElementById("keuzes").style.display = "block";
    toonVolgendWoord();
}

function toonVolgendWoord() {
    if (huidigeIndex >= woorden.length) {
        document.getElementById("woord-container").innerText = "Klaar!";
        document.getElementById("keuzes").style.display = "none";
        toonFouten();
        return;
    }

    const item = woorden[huidigeIndex];
    huidigeWoord = item.woord;
    document.getElementById("commentaar").innerText = `Hint: ${item.commentaar}`;
    blanks = [];
    keuzesIndex = 0;
    knoppenGebruikt = false;

    let temp = huidigeWoord;
    let regex = /(i|y)/;
    let match = regex.exec(temp);

    if (match) {
        let start = match.index;
        let eind = start + match[0].length;
        blanks.push(match[0]);

        let parts = [
            temp.slice(0, start),
            "__",
            temp.slice(eind)
        ];

        document.getElementById("woord-container").innerHTML = parts.join("");
    } else {
        document.getElementById("woord-container").innerText = temp;
    }

    document.getElementById("feedback").innerText = "";
}

function kies(keuze) {
    if (knoppenGebruikt) return;

    const juiste = blanks[keuzesIndex];
    const woordEl = document.getElementById("woord-container");

    let regex = /(i|y)/;
    let match = regex.exec(huidigeWoord);

    if (match) {
        let start = match.index;
        let eind = start + match[0].length;

        let gemarkeerd;

        if (keuze === juiste) {
            gemarkeerd = huidigeWoord;
        } else {
            gemarkeerd =
                huidigeWoord.slice(0, start) +
                `<span class="incorrect">${juiste}</span>` +
                huidigeWoord.slice(eind);
        }

        woordEl.innerHTML = gemarkeerd;
    }

    if (keuze !== juiste && !foutenLijst.some(f => f.woord === huidigeWoord)) {
        foutenLijst.push({
            woord: huidigeWoord,
            gekozen: keuze,
            correct: juiste
        });
    }

    knoppenGebruikt = true;

    keuzesIndex++;
    if (keuzesIndex >= blanks.length) {
        setTimeout(() => {
            huidigeIndex++;
            toonVolgendWoord();
        }, 1500);
    }
}

function toonFouten() {
    const foutenContainer = document.getElementById("fouten-lijst");
    const downloadKnop = document.getElementById("download-fouten");

    if (foutenLijst.length === 0) {
        foutenContainer.innerText = "Goed gedaan! Geen fouten gemaakt.";
        downloadKnop.style.display = "none";
        return;
    }

    let html = "<h3>Fout beantwoorde woorden:</h3><ul>";
    foutenLijst.forEach(fout => {
        html += `<li>${fout.woord}</li>`;
    });
    html += "</ul>";
    foutenContainer.innerHTML = html;

    downloadKnop.style.display = "inline-block";
    downloadKnop.onclick = downloadFoutenlijstAlsExcel;
}

function downloadFoutenlijstAlsExcel() {
    if (foutenLijst.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(foutenLijst);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Foutenlijst");

    XLSX.writeFile(wb, "foutenlijst.xlsx");
}
