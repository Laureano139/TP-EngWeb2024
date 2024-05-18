import json
import xml.etree.ElementTree as ET
import os

current_dir = os.path.dirname(__file__)

atual_folder = os.path.join(current_dir, "atual")

if os.path.exists(atual_folder):
    IMAGENSATUAIS = os.listdir(atual_folder)
else:
    IMAGENSATUAIS = []

def figurasAtuais(idRua, nome):
    figuras = []
    numFiguras = 0
    for imagem in IMAGENSATUAIS:
        if imagem.startswith(f"{idRua}-"):
            numFiguras += 1
            img = {
                "_id": f"MRB-{idRua}-atual_{numFiguras}",
                "imagem": {
                    "path": f"../atual/{imagem}",
                    "largura": None
                },
                "legenda": f"{nome} - Vista Atual nº {numFiguras}"
            }
            figuras.append(img)
    return figuras

def parseFiguras(corpo):
    figuras = []
    for fig in corpo.findall("./figura"):
        figId = fig.attrib.get("id", "")
        img = fig.find("./imagem")
        path = img.attrib.get("path", "")
        largura = img.attrib.get("largura", None)
        imagem = {"path": path, "largura": largura}
        legenda = (fig.find("./legenda").text or "").strip()
        figura = {"_id": figId, "imagem": imagem, "legenda": legenda}
        figuras.append(figura)
    return figuras

def parseRefs(nodo):
    entidades = []
    lugares = []
    datas = []
    texto = ""
    for child in nodo:
        if child.tag in ["entidade", "lugar", "data"]:
            text = (child.text or " ") + (child.tail or " ")
            texto += text
            if child.tag == "entidade":
                entidades.append({"nome": child.text.strip(), "tipo": child.attrib.get("tipo", "pessoa")})
            elif child.tag == "lugar":
                lugares.append({"nome": child.text.strip(), "norm": child.attrib.get("norm", None)})
            elif child.tag == "data":
                datas.append(child.text.strip())
    refs = {"entidades": entidades, "lugares": lugares, "datas": datas}
    return refs, texto

def parseParagrafos(nodo):
    texto = ""
    refs = {"entidades": [], "lugares": [], "datas": []}
    for para in nodo.findall("./para"):
        r, t = parseRefs(para)
        t = (para.text or "").strip() + " " + t
        texto += " ".join(t.split())
        for key in r.keys():
            refs[key].extend(r[key])
    return {"refs": refs, "texto": texto}

def parseDesc(casa):
    desc = {"refs": {"entidades": [], "lugares": [], "datas": []}, "texto": ""}
    for descNode in casa.findall("./desc"):
        par = parseParagrafos(descNode)
        desc["texto"] += par["texto"] + "\n"
        refs = par["refs"]
        for key in refs.keys():
            desc["refs"][key].extend(refs[key])
    desc["texto"] = desc["texto"].strip()
    return desc

def parseCasa(c):
    numero = (c.find("./número").text or "").strip()
    enfiteutas = ", ".join([enf.text.strip() if enf.text else "-" for enf in c.findall("./enfiteuta")])
    foro = (c.find("./foro").text or "").strip() if c.find("./foro") is not None else None
    desc = parseDesc(c)
    vista = (c.find("./vista").text or "").strip() if c.find("./vista") is not None else None
    return {"numero": numero, "enfiteutas": enfiteutas, "foro": foro, "desc": desc, "vista": vista}

def parseCasas(listaCasas):
    casas = []
    for lista in listaCasas:
        for casa in lista.findall("./casa"):
            casas.append(parseCasa(casa))
    return casas

def parseXML(xmlFile):
    objeto = {}
    tree = ET.parse(xmlFile)
    rua = tree.getroot()
    meta = rua.find("./meta")
    objeto["numero"] = int((meta.find("./número").text or "").strip())
    objeto["nome"] = (meta.find("./nome").text or "").strip()
    objeto["pos"] = {"latitude": 0, "longitude":  0}
    corpo = rua.find("./corpo")
    objeto["figuras"] = parseFiguras(corpo)
    objeto["figuras"].extend(figurasAtuais(objeto["numero"], objeto["nome"]))
    objeto["paragrafo"] = parseParagrafos(corpo)
    objeto["casas"] = parseCasas(corpo.findall("./lista-casas"))
    return objeto

def main():
    texto_folder = os.path.join(current_dir, "texto")
    if os.path.exists(texto_folder):
        XML_FILES = [os.path.join(texto_folder, f) for f in os.listdir(texto_folder) if f.endswith('.xml')]
    else:
        XML_FILES = []

    dataset = []
    for xmlFile in XML_FILES:
        dataset.append(parseXML(xmlFile))

    datasetDir = os.path.join(current_dir, "..", "convertedJSONDataset")
    if not os.path.exists(datasetDir):
        os.makedirs(datasetDir)

    with open(os.path.join(datasetDir, "ruas.json"), "w", encoding="utf-8") as jsonFile:
        json.dump(dataset, jsonFile, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    main()