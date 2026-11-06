import csv
import os
import shutil
import sys

# --lang en 지원
if any("en" in arg.lower() for arg in sys.argv[1:]):
    import fill_examples_en
    fill_examples_en.fill_english_data()
    sys.exit(0)

INPUT_FILE = "spanish_5000_master.csv"
BACKUP_FILE = "spanish_5000_master.csv.bak"

if os.path.exists(INPUT_FILE):
    shutil.copyfile(INPUT_FILE, BACKUP_FILE)
    print(f"📦 원본 백업 완료: {BACKUP_FILE}")
else:
    print(f"❌ 오류: {INPUT_FILE} 파일을 찾을 수 없습니다.")
    exit(1)

EXAMPLE_DB = {
    # 기존 단어군
       # === Unit 11 ~ Unit 13 (Rank 301 ~ 400 주요 어휘) ===
    "volver": ("Quiero volver a casa.", "집에 돌아가고 싶다."),
    "esas": ("Esas manzanas son dulces.", "저 사과들은 달콤하다."),
    "quizá": ("Quizá llueva esta tarde.", "오늘 오후에 비가 올지도 모른다."),
    "contra": ("El partido es contra ellos.", "경기는 그들과의 대결이다."),
    "camino": ("Estoy en el camino correcto.", "올바른 길로 가고 있다."),
    "durante": ("Estudié durante dos horas.", "두 시간 동안 공부했다."),
    "hablando": ("Están hablando por teléfono.", "그들은 통화 중이다."),
    "manera": ("De ninguna manera.", "절대 안 된다."),
    "muerto": ("Las plantas se han muerto.", "식물들이 말라 죽었다."),
    "persona": ("Es una persona muy amable.", "매우 친절한 사람이다."),
    "rápido": ("Él corre muy rápido.", "그는 아주 빨리 달린다."),
    "cuál": ("¿Cuál prefieres de los dos?", "둘 중 어느 것이 더 좋니?"),
    "ayuda": ("Necesito tu ayuda ahora.", "지금 네 도움이 필요해."),
    "historia": ("Me gusta leer historias.", "이야기 읽는 것을 좋아한다."),
    "iba": ("Iba a la tienda ahora.", "지금 가게에 가려던 참이었다."),
    "supongo": ("Supongo que tienes razón.", "네 말이 맞는 것 같네."),
    "nueva": ("Tengo una bicicleta nueva.", "새 자전거가 생겼다."),
    "entiendo": ("Ahora entiendo la lección.", "이제 수업 내용이 이해된다."),
    "dentro": ("Hace calor dentro de casa.", "집 안이 따뜻하다."),
    "casi": ("Casi termino la tarea.", "과제를 거의 다 끝냈다."),
    "puerta": ("Cierra la puerta por favor.", "문 좀 닫아주세요."),
    "ves": ("¿Ves ese edificio alto?", "저 높은 건물이 보이니?"),
    "pasar": ("¿Puedo pasar adelante?", "안으로 들어가도 될까요?"),
    "primero": ("Primero lávate las manos.", "먼저 손부터 씻어라."),
    "significa": ("¿Qué significa esta palabra?", "이 단어는 무슨 뜻인가요?"),
    "semana": ("La próxima semana descanso.", "다음 주에는 쉰다."),
    "hacia": ("Vamos hacia el centro.", "우리는 시내 쪽으로 향한다."),
    "quizás": ("Quizás vayamos al cine.", "어쩌면 영화 보러 갈지도 모른다."),
    "espero": ("Espero que todo vaya bien.", "모든 일이 잘 풀리길 바란다."),
    "juntos": ("Trabajamos juntos en el proyecto.", "우리는 프로젝트를 함께 한다."),
    "año": ("El próximo año viajaré.", "내년에 여행을 갈 것이다."),
    "niños": ("Los niños juegan fuera.", "아이들이 밖에서 논다."),
    "pronto": ("Nos vemos muy pronto.", "아주 곧 다시 만나요."),
    "tío": ("Mi tío vive en Madrid.", "우리 삼촌은 마드리드에 사신다."),
    "suerte": ("¡Buena suerte en el examen!", "시험 잘 치르길 바란다!"),
    "siquiera": ("No dijo ni siquiera gracias.", "고맙다는 말조차 하지 않았다."),
    "feliz": ("Estoy muy feliz hoy.", "오늘 정말 행복하다."),
    "venir": ("¿Puedes venir a mi fiesta?", "내 파티에 올 수 있니?"),
    "hija": ("Mi hija va a la escuela.", "내 딸은 학교에 다닌다."),
    "gustaría": ("Me gustaría un vaso de agua.", "물 한 잔 마시고 싶습니다."),
    "minutos": ("Llego en diez minutos.", "10분 후에 도착합니다."),
    "cuánto": ("¿Cuánto cuesta este libro?", "이 책은 얼마인가요?"),
    "muerte": ("La vida vence a la muerte.", "생명이 죽음을 이긴다."),
    "dejar": ("Déjame en paz por favor.", "나를 좀 내버려 둬."),
    "realidad": ("En realidad no lo sé.", "사실은 잘 모르겠습니다."),
    "deja": ("Deja las llaves en la mesa.", "열쇠를 탁자에 둬라."),
    "problemas": ("No busques más problemas.", "더 이상 문제 만들지 마라."),
    "vi": ("Vi una película interesante.", "흥미로운 영화를 한 편 봤다."),
    "da": ("Me da igual la hora.", "시간은 상관없다."),
    "importante": ("Es importante practicar.", "연습하는 것이 중요하다."),
    "dijiste": ("¿Qué dijiste hace un momento?", "방금 뭐라고 말했니?"),
    "corazón": ("Te quiero de todo corazón.", "진심으로 널 좋아해."),
    "miedo": ("No tengas miedo a fallar.", "실패를 두려워하지 마라."),
    "jefe": ("El jefe está en la oficina.", "사장님은 사무실에 계신다."),
    "haré": ("Lo haré lo antes posible.", "가능한 한 빨리 하겠습니다."),
    "justo": ("Llegaste justo a tiempo.", "딱 제시간에 맞춰 왔구나."),
    "horas": ("Dormí ocho horas anoche.", "어젯밤 8시간을 잤다."),
    "poder": ("El saber da poder.", "아는 것이 힘이 된다."),
    "buenos": ("Buenos días profesor.", "선생님 좋은 아침입니다."),
    "esposa": ("Mi esposa cocina muy rico.", "내 아내는 요리를 정말 잘한다."),
    "manos": ("Lávate las manos bien.", "손을 깨끗이 씻어라."),
    "debes": ("Debes descansar esta tarde.", "오늘 오후에는 쉬어야 한다."),
    "viene": ("El autobús ya viene.", "버스가 벌써 오고 있다."),
    "venga": ("Venga conmigo por favor.", "저를 따라오세요."),
    "nuestros": ("Nuestros amigos son amables.", "우리 친구들은 친절하다."),
    "ojos": ("Tiene los ojos marrones.", "그녀는 갈색 눈을 가졌다."),
    "adelante": ("Siga adelante todo recto.", "계속 앞으로 직진하세요."),
    "encontrar": ("Quiero encontrar mis gafas.", "내 안경을 찾고 싶다."),
    "mano": ("Dame la mano al cruzar.", "길 건널 때 손을 잡아라."),
    "cinco": ("Son las cinco en punto.", "정각 5시입니다."),
    "niño": ("El niño lee un libro.", "아이가 책을 읽는다."),
    "ninguna": ("No tengo ninguna pregunta.", "질문이 하나도 없습니다."),
    "otros": ("Los otros chicos juegan.", "다른 소년들이 놀고 있다."),
    "cara": ("Lávate la cara con agua fría.", "찬물로 세수해라."),
    "cuidado": ("Ten mucho cuidado al bajar.", "내려갈 때 조심해라."),
    "bajo": ("El gato duerme bajo la cama.", "고양이가 침대 밑에서 잔다."),
    "cerca": ("La estación está muy cerca.", "역이 아주 가까이에 있다."),
    "viejo": ("Este abrigo es viejo pero bueno.", "이 코트는 낡았지만 좋다."),
    "déjame": ("Déjame ver esa foto.", "그 사진 좀 보여줘."),
    "noches": ("Buenas noches y descansa.", "잘 자고 푹 쉬어라."),
    "bastante": ("Hace bastante calor hoy.", "오늘 날씨가 꽤 덥다."),
    "fin": ("Llegamos al fin del camino.", "길의 끝에 도착했다."),
    "tomar": ("Vamos a tomar un café.", "커피 한 잔 마시러 가자."),
    "único": ("Este es mi único bolso.", "이것이 내 유일한 가방이다."),
    "misma": ("Ella vive en la misma calle.", "그녀는 같은 거리에 산다."),
    "escucha": ("Escucha con mucha atención.", "주의 깊게 잘 들어라."),
    "ningún": ("No veo ningún fallo aquí.", "여기 아무런 결함도 보이지 않는다."),
    "suficiente": ("Esto es suficiente para hoy.", "오늘 것은 이걸로 충분하다."),
    "punto": ("Ese es un buen punto de vista.", "그것은 좋은 관점이다."),
    "cuándo": ("¿Cuándo empieza la fiesta?", "파티는 언제 시작하나요?"),
    "sigue": ("Sigue estudiando así.", "계속 그렇게 공부해라."),
    "haya": ("Espero que haya sitio.", "자리가 있기를 바란다."),
    "equipo": ("Nuestro equipo ganó el torneo.", "우리 팀이 대회에서 우승했다."),
    "grande": ("Compré una mesa grande.", "큰 탁자를 하나 샀다."),
    "necesita": ("Él necesita una chaqueta.", "그는 재킷이 필요하다."),
    "llegar": ("Queremos llegar temprano.", "일찍 도착하고 싶다."),
    "jueves": ("Nos vemos el jueves.", "목요일에 만나요."),
    "viernes": ("¡Por fin es viernes!", "드디어 금요일이다!"),


}

rows = []
updated_count = 0
preserved_count = 0

with open(INPUT_FILE, mode="r", encoding="utf-8-sig", errors="replace") as f:
    reader = csv.reader(f)
    for row in reader:
        if not row:
            continue
        while len(row) < 9:
            row.append("")

        word = row[1].strip()

        # 이미 예문이 채워져 있으면 안전하게 보존
        if row[7].strip() != "" and row[8].strip() != "":
            preserved_count += 1
        # 비어 있고 사전에 예문이 있으면 주입
        elif word in EXAMPLE_DB:
            es_ex, ko_ex = EXAMPLE_DB[word]
            row[7] = es_ex.strip()
            row[8] = ko_ex.strip()
            updated_count += 1

        rows.append(row)

with open(INPUT_FILE, mode="w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerows(rows)

print("=" * 45)
print(f"✅ 기존 예문 보존: {preserved_count}개")
print(f"✨ 신규 예문 주입: {updated_count}개")
print(f"🎉 파일 업데이트 완료: {INPUT_FILE}")
print("=" * 45)

