import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "data", "brief-data.json")
d = json.load(open(PATH, encoding="utf8"))

MEDIA_X = "Photo/clip teaser, un peu plus spicy ok. Lien OnlyFans direct dans le post."
MEDIA_REDDIT = "Photo verticale, cadrage taille ou plein pied, regard caméra, lumière naturelle. Watermark @blondymandise discret."
MEDIA_SNAP = "Story verticale + snap premium. Publication 100% manuelle."

def X(time, moment, texte, astuce="Teaser direct, lien OnlyFans autorisé dans le post."):
    return {"platKey":"x","plats":"X","time":time,"moment":moment,"type":"Teaser promo → OnlyFans",
            "texte":texte,"media":MEDIA_X,"lien":"OnlyFans","astuce":astuce}
def RD(time, moment, texte, sub, flair):
    return {"platKey":"reddit","plats":"Reddit","time":time,"moment":moment,"type":"Teaser (renvoi profil)",
            "texte":texte,"media":MEDIA_REDDIT,"lien":"Reddit",
            "astuce":"Sub cible : "+sub+" · Flair requis : "+flair+" · 1 post promo pour 3 contributions, jamais 2× la même image le même jour."}
def SN(time, moment, texte, astuce="100% manuel : story publique + snap premium/privé. Teaser vers OnlyFans."):
    return {"platKey":"snapchat","plats":"Snapchat","time":time,"moment":moment,"type":"Story / Snap (manuel)",
            "texte":texte,"media":MEDIA_SNAP,"lien":"OnlyFans","astuce":astuce}

extra = {
 "Lundi": [
   X("16:00","Après-midi","On m'a demandé mes « règles » perso… j'ai répondu sans filtre 😏 (le reste est ailleurs 👇)"),
   RD("19:00","Soir","Petit débat du lundi : le libertinage, tabou ou libération ? Je donne mon avis (et un peu plus) sur mon profil.","r/GoneWildFrance","Vérifiée (F)"),
   SN("20:30","Soir","Coulisses de ma journée + un aperçu que je ne posterai nulle part ailleurs 👀 lien en story."),
 ],
 "Mardi": [
   X("12:00","Midi","Team « à deux » ou team « chacun son tour » ? 😈 Je réponds cash là où il faut 👇"),
   X("22:00","Nuit","Il est tard, je m'ennuie… viens voir ce que je poste quand personne ne regarde 🌙"),
   RD("19:00","Soir","Question sérieuse : le libertinage, ça vous rend plutôt curieux ou choqué ? (parfois je réponds en DM 😇)","r/FrenchGoneWild","Photo (F)"),
   SN("20:30","Soir","Aperçu du tournage de demain 🎬 la version soft est ici, la vraie est ailleurs."),
 ],
 "Mercredi": [
   X("16:00","Après-midi","Journée tournage 🎥 spoiler : j'ai dit des choses que YouTube ne laissera jamais passer. La version non censurée ? Tu sais où 😏"),
   RD("12:00","Midi","Jour de tournage pour ma chaîne. Petit teaser de l'ambiance (et de la tenue) sur mon profil.","r/GoneWildFrance","Vérifiée (F)"),
   SN("20:30","Soir","Behind the scenes du tournage, rien que pour vous 🎬"),
 ],
 "Jeudi": [
   X("20:00","Soir","Demain, grosse vidéo. Ce soir, gros mood 🔥 un avant-goût par ici 👇"),
   RD("19:00","Soir","J'ai répondu à 10 questions gênantes en vidéo (elle sort demain). Les plus hot, je les garde pour mon profil 😇","r/FrenchNSFW","Vérifiée (F)"),
   SN("20:30","Soir","Teasing de la vidéo de demain + un snap que je n'assumerais pas en public 🙈"),
 ],
 "Vendredi": [
   X("08:15","8h — Sortie","Nouvelle vidéo 🔥 « 10 questions gênantes sur le libertinage ». Version YouTube = soft. Le reste = 👇"),
   X("21:00","Soir","Vous avez aimé la vidéo ? Le debrief coquin est dispo ce soir 🔓"),
   RD("12:00","Midi","Ma nouvelle vidéo sur le libertinage vient de sortir — je réponds à tout, même à ce qu'on ne me demande pas 😉 (profil en bio).","r/GoneWildFrance","Vérifiée (F)"),
   SN("20:30","Soir","Jour de sortie 🎬 réactions en direct + exclu snap premium."),
 ],
 "Samedi": [
   X("16:00","Après-midi","Le passage que tout le monde m'a demandé de reposter… il est en entier là où il faut 👀"),
   RD("19:00","Soir","On m'a posé LA question n°9 en commentaire. Ma vraie réponse est un peu trop pour YouTube 😏 (profil).","r/FrenchGoneWild","Photo (F)"),
   SN("20:30","Soir","Samedi soir mood 🌙 snap privé pour mes préférés."),
 ],
 "Dimanche": [
   X("17:00","Après-midi","Bilan de la semaine : vous avez été sages ? La récompense est par ici 😈"),
   RD("12:00","Midi","Récap de ma semaine de contenu (SFW ici, le reste sur mon profil). Bon dimanche 🤍","r/GoneWildFrance","Vérifiée (F)"),
   SN("20:30","Soir","Bilan intime de la semaine + teasing de la semaine prochaine 🔥"),
 ],
}

MOMENT_ORDER = {"8h — Sortie":0,"Matin":1,"Midi":2,"Après-midi":3,"Soir":4,"Nuit":5}
def sortkey(p):
    return (MOMENT_ORDER.get(p.get("moment"),9), p.get("time","99:99"))

added = 0
for day in d["schedule"]:
    name = day["day"]
    if name in extra:
        # avoid double-adding if rerun
        existing = {(p["platKey"], p["time"], p["texte"][:15]) for p in day["posts"]}
        for p in extra[name]:
            if (p["platKey"], p["time"], p["texte"][:15]) not in existing:
                day["posts"].append(p); added += 1
        day["posts"].sort(key=sortkey)

# links: add X and Snapchat
d["links"].setdefault("X", "https://x.com/A_COMPLETER")
d["links"].setdefault("Snapchat", "https://snapchat.com/add/A_COMPLETER")

json.dump(d, open(PATH,"w",encoding="utf8"), ensure_ascii=False, indent=2)
print("added posts:", added)
# report counts per platform
from collections import Counter
c = Counter()
for day in d["schedule"]:
    for p in day["posts"]:
        c[p["platKey"]] += 1
print("posts per platform:", dict(c))
print("total posts:", sum(c.values()))
