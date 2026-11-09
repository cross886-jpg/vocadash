#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
refine_english_master.py
영어 마스터 데이터(english_5000_master.csv)의 불완전한 사전 메타 찌꺼기,
문법 용어(과거/분사형), 사전 설명 번호/꺽쇠 및 쉼표(,)를 전면 정제하는 파이프라인.
"""

import csv
import os
import re
import shutil

INPUT_CSV = "english_5000_master.csv"
BACKUP_CSV = "english_5000_master.csv.bak_refine"

# 1. 문법용어/불완전 파싱 발생 불규칙 및 핵심 어휘 최적화 사전 (100% 우선 적용)
CURATED_WORDS = {
    "paid": {
        "meaning": "지불된 / 유급의",
        "pron": "[페이드]",
        "ex_en": "She took a paid vacation.",
        "ex_ko": "그녀는 유급 휴가를 떠났다."
    },
    "got": {
        "meaning": "얻었다 / 받았다",
        "pron": "[갓]",
        "ex_en": "I got a letter from my friend.",
        "ex_ko": "나는 친구로부터 편지를 받았다."
    },
    "said": {
        "meaning": "말했다",
        "pron": "[세드]",
        "ex_en": "He said that he was happy.",
        "ex_ko": "그는 행복하다고 말했다."
    },
    "won": {
        "meaning": "이겼다 / 획득했다",
        "pron": "[원]",
        "ex_en": "Our team won the game.",
        "ex_ko": "우리 팀이 경기에서 이겼다."
    },
    "told": {
        "meaning": "말했다 / 전했다",
        "pron": "[톨드]",
        "ex_en": "She told me the truth.",
        "ex_ko": "그녀는 나에게 진실을 말했다."
    },
    "made": {
        "meaning": "만들었다 / 만들어진",
        "pron": "[메이드]",
        "ex_en": "My mother made a delicious cake.",
        "ex_ko": "어머니께서 맛있는 케이크를 만들어 주셨다."
    },
    "done": {
        "meaning": "다 끝난 / 완료된",
        "pron": "[던]",
        "ex_en": "I have done my homework.",
        "ex_ko": "나는 숙제를 다 끝냈다."
    },
    "wanted": {
        "meaning": "원했다",
        "pron": "[원티드]",
        "ex_en": "He wanted to travel abroad.",
        "ex_ko": "그는 해외 여행을 가기를 원했다."
    },
    "came": {
        "meaning": "왔다",
        "pron": "[케임]",
        "ex_en": "They came to my house yesterday.",
        "ex_ko": "그들은 어제 우리 집에 왔다."
    },
    "found": {
        "meaning": "찾았다 / 발견했다",
        "pron": "[파운드]",
        "ex_en": "I found my lost keys on the desk.",
        "ex_ko": "나는 책상 위에서 잃어버린 열쇠를 찾았다."
    },
    "went": {
        "meaning": "갔다",
        "pron": "[웬트]",
        "ex_en": "We went to the park this afternoon.",
        "ex_ko": "우리는 오늘 오후에 공원에 갔다."
    },
    "seen": {
        "meaning": "본 / 목격된",
        "pron": "[신]",
        "ex_en": "Have you seen my glasses?",
        "ex_ko": "내 안경을 본 적이 있니?"
    },
    "heard": {
        "meaning": "들었다",
        "pron": "[허드]",
        "ex_en": "I heard good news this morning.",
        "ex_ko": "나는 오늘 아침에 좋은 소식을 들었다."
    },
    "knew": {
        "meaning": "알았다",
        "pron": "[뉴]",
        "ex_en": "I knew the answer right away.",
        "ex_ko": "나는 그 정답을 곧바로 알았다."
    },
    "took": {
        "meaning": "가져갔다 / 탔다",
        "pron": "[툭]",
        "ex_en": "He took the bus to school.",
        "ex_ko": "그는 학교로 가는 버스를 탔다."
    },
    "gone": {
        "meaning": "떠난 / 사라진",
        "pron": "[곤]",
        "ex_en": "All the snow is gone now.",
        "ex_ko": "이제 모든 눈이 다 녹아 사라졌다."
    },
    "lost": {
        "meaning": "잃어버린 / 길을 잃은",
        "pron": "[로스트]",
        "ex_en": "I lost my wallet on the subway.",
        "ex_ko": "나는 지하철에서 지갑을 잃어버렸다."
    },
    "gave": {
        "meaning": "주었다",
        "pron": "[게이브]",
        "ex_en": "She gave me a wonderful book.",
        "ex_ko": "그녀는 나에게 멋진 책을 한 권 주었다."
    },
    "brought": {
        "meaning": "가져왔다 / 데려왔다",
        "pron": "[브로드]",
        "ex_en": "He brought an umbrella with him.",
        "ex_ko": "그는 우산을 챙겨 가져왔다."
    },
    "tried": {
        "meaning": "시도했다 / 노력했다",
        "pron": "[트라이드]",
        "ex_en": "I tried my best to pass the exam.",
        "ex_ko": "나는 시험에 합격하기 위해 최선을 다했다."
    },
    "taken": {
        "meaning": "가져간 / 차지된",
        "pron": "[테이큰]",
        "ex_en": "This seat is already taken.",
        "ex_ko": "이 자리는 이미 임자가 있습니다."
    },
    "sent": {
        "meaning": "보냈다",
        "pron": "[센트]",
        "ex_en": "I sent an email to the teacher.",
        "ex_ko": "나는 선생님께 이메일을 보냈다."
    },
    "known": {
        "meaning": "알려진 / 유명한",
        "pron": "[노운]",
        "ex_en": "He is known as a great singer.",
        "ex_ko": "그는 훌륭한 가수로 널리 알려져 있다."
    },
    "felt": {
        "meaning": "느꼈다",
        "pron": "[펠트]",
        "ex_en": "I felt very tired after work.",
        "ex_ko": "나는 퇴근 후에 매우 피곤함을 느꼈다."
    },
    "given": {
        "meaning": "주어진",
        "pron": "[기븐]",
        "ex_en": "We must finish in the given time.",
        "ex_ko": "우리는 주어진 시간 안에 끝내야 한다."
    },
    "kept": {
        "meaning": "유지했다 / 간직했다",
        "pron": "[켑트]",
        "ex_en": "She kept her promise to me.",
        "ex_ko": "그녀는 나에게 한 약속을 지켰다."
    },
    "caught": {
        "meaning": "잡았다 / 걸렸다",
        "pron": "[코트]",
        "ex_en": "I caught a cold last week.",
        "ex_ko": "나는 지난주에 감기에 걸렸다."
    },
    "meant": {
        "meaning": "의미했다 / 의도했다",
        "pron": "[멘트]",
        "ex_en": "I meant no harm to anyone.",
        "ex_ko": "나는 누구에게도 해를 끼칠 의도가 없었다."
    },
    "born": {
        "meaning": "태어난",
        "pron": "[본]",
        "ex_en": "She was born in Seoul.",
        "ex_ko": "그녀는 서울에서 태어났다."
    },
    "lying": {
        "meaning": "거짓말하는 / 누워있는",
        "pron": "[라잉]",
        "ex_en": "He was lying on the grass.",
        "ex_ko": "그는 잔디밭 위에 누워 있었다."
    },
    "broke": {
        "meaning": "깨뜨렸다 / 부러뜨렸다",
        "pron": "[브로크]",
        "ex_en": "He broke the window by accident.",
        "ex_ko": "그는 실수로 창문을 깨뜨렸다."
    },
    "bought": {
        "meaning": "샀다 / 구매했다",
        "pron": "[보트]",
        "ex_en": "I bought fresh bread at the bakery.",
        "ex_ko": "나는 빵집에서 갓 구운 빵을 샀다."
    },
    "forgot": {
        "meaning": "잊었다",
        "pron": "[포갓]",
        "ex_en": "I forgot to bring my homework.",
        "ex_ko": "나는 숙제를 가져오는 것을 잊었다."
    },
    "fell": {
        "meaning": "떨어졌다 / 넘어졌다",
        "pron": "[펠]",
        "ex_en": "The apple fell from the tree.",
        "ex_ko": "사과가 나무에서 떨어졌다."
    },
    "broken": {
        "meaning": "고장 난 / 부서진",
        "pron": "[브로큰]",
        "ex_en": "My computer is broken now.",
        "ex_ko": "내 컴퓨터가 지금 고장 났다."
    },
    "spent": {
        "meaning": "썼다 / 보냈다",
        "pron": "[스펜트]",
        "ex_en": "We spent a wonderful time together.",
        "ex_ko": "우리는 함께 멋진 시간을 보냈다."
    },
    "became": {
        "meaning": "되었다",
        "pron": "[비케임]",
        "ex_en": "He became a successful doctor.",
        "ex_ko": "그는 성공한 의사가 되었다."
    },
    "wrote": {
        "meaning": "썼다",
        "pron": "[로트]",
        "ex_en": "She wrote a letter to her parents.",
        "ex_ko": "그녀는 부모님께 편지를 썼다."
    },
    "stuck": {
        "meaning": "갇힌 / 달라붙은",
        "pron": "[스턱]",
        "ex_en": "We got stuck in heavy traffic.",
        "ex_ko": "우리는 극심한 교통 체증에 갇혔다."
    },
    "sold": {
        "meaning": "팔았다 / 팔린",
        "pron": "[솔드]",
        "ex_en": "They sold all the tickets quickly.",
        "ex_ko": "그들은 모든 표를 빠르게 팔았다."
    },
    "written": {
        "meaning": "쓰인 / 작성된",
        "pron": "[리튼]",
        "ex_en": "The report was written in English.",
        "ex_ko": "그 보고서는 영어로 작성되었다."
    },
    "stole": {
        "meaning": "훔쳤다",
        "pron": "[스톨]",
        "ex_en": "Someone stole his bicycle yesterday.",
        "ex_ko": "누군가 어제 그의 자전거를 훔쳐갔다."
    },
    "built": {
        "meaning": "지었다 / 건축된",
        "pron": "[빌트]",
        "ex_en": "They built a new library in town.",
        "ex_ko": "그들은 동네에 새 도서관을 지었다."
    },
    "gotten": {
        "meaning": "얻은 / 된",
        "pron": "[가튼]",
        "ex_en": "It has gotten quite cold outside.",
        "ex_ko": "바깥 날씨가 꽤 쌀쌀해졌다."
    },
    "held": {
        "meaning": "잡았다 / 열렸다",
        "pron": "[헬드]",
        "ex_en": "The meeting was held in the hall.",
        "ex_ko": "그 회의는 강당에서 열렸다."
    },
    "spoke": {
        "meaning": "말했다",
        "pron": "[스포크]",
        "ex_en": "He spoke English very fluently.",
        "ex_ko": "그는 영어를 아주 유창하게 말했다."
    },
    "understood": {
        "meaning": "이해했다",
        "pron": "[언더스투드]",
        "ex_en": "I understood the lesson completely.",
        "ex_ko": "나는 그 수업을 완전히 이해했다."
    },
    "taught": {
        "meaning": "가르쳤다",
        "pron": "[토트]",
        "ex_en": "She taught math at our school.",
        "ex_ko": "그녀는 우리 학교에서 수학을 가르쳤다."
    },
    "whoo": {
        "meaning": "와우 / 야호",
        "pron": "[후]",
        "ex_en": "Whoo that was really exciting.",
        "ex_ko": "와우 그것은 정말 신나는 일이었다."
    },
    "forgotten": {
        "meaning": "잊힌",
        "pron": "[포가튼]",
        "ex_en": "That old song is never forgotten.",
        "ex_ko": "그 옛 노래는 결코 잊히지 않는다."
    },
    "began": {
        "meaning": "시작했다",
        "pron": "[비갠]",
        "ex_en": "The movie began ten minutes ago.",
        "ex_ko": "그 영화는 십 분 전에 시작했다."
    },
    "stolen": {
        "meaning": "도난당한",
        "pron": "[스톨른]",
        "ex_en": "The stolen car was found today.",
        "ex_ko": "도난당한 차량이 오늘 발견되었다."
    },
    "threw": {
        "meaning": "던졌다",
        "pron": "[스루]",
        "ex_en": "He threw the ball to the catcher.",
        "ex_ko": "그는 포수에게 공을 던졌다."
    },
    "slept": {
        "meaning": "잤다",
        "pron": "[슬렙트]",
        "ex_en": "I slept well all night long.",
        "ex_ko": "나는 밤새도록 푹 잘 잤다."
    },
    "ed": {
        "meaning": "과거형 접미사",
        "pron": "[이드]",
        "ex_en": "The word ended with the letters ed.",
        "ex_ko": "그 단어는 ed 철자로 끝났다."
    },
    "buried": {
        "meaning": "묻힌 / 매장된",
        "pron": "[베리드]",
        "ex_en": "They found buried treasure on the island.",
        "ex_ko": "그들은 섬에서 묻힌 보물을 발견했다."
    },
    "hidden": {
        "meaning": "숨겨진",
        "pron": "[히든]",
        "ex_en": "There is a hidden door behind the bookshelf.",
        "ex_ko": "책장 뒤에 숨겨진 문이 하나 있다."
    },
    "ate": {
        "meaning": "먹었다",
        "pron": "[에이트]",
        "ex_en": "We ate lunch at a nice restaurant.",
        "ex_ko": "우리는 좋은 식당에서 점심을 먹었다."
    },
    "grew": {
        "meaning": "자랐다 / 길렀다",
        "pron": "[그루]",
        "ex_en": "The flowers grew quickly this spring.",
        "ex_ko": "이번 봄에 꽃들이 쑥쑥 자랐다."
    },
    "grown": {
        "meaning": "성장한 / 자란",
        "pron": "[그로운]",
        "ex_en": "He has grown into a fine young man.",
        "ex_ko": "그는 멋진 청년으로 성장했다."
    },
    "led": {
        "meaning": "이끌었다",
        "pron": "[레드]",
        "ex_en": "She led the project to success.",
        "ex_ko": "그녀는 그 프로젝트를 성공으로 이끌었다."
    },
    "fought": {
        "meaning": "싸웠다",
        "pron": "[포트]",
        "ex_en": "They fought bravely for their country.",
        "ex_ko": "그들은 조국을 위해 용감히 싸웠다."
    },
    "drove": {
        "meaning": "운전했다",
        "pron": "[드로브]",
        "ex_en": "He drove his family to the beach.",
        "ex_ko": "그는 가족들을 태우고 해변으로 운전해 갔다."
    },
    "chose": {
        "meaning": "선택했다",
        "pron": "[초우즈]",
        "ex_en": "I chose the blue shirt yesterday.",
        "ex_ko": "나는 어제 파란색 셔츠를 선택했다."
    },
    "stood": {
        "meaning": "서 있었다",
        "pron": "[스투드]",
        "ex_en": "We stood in line for one hour.",
        "ex_ko": "우리는 한 시간 동안 줄을 서 있었다."
    },
    "laid": {
        "meaning": "놓았다 / 눕혔다",
        "pron": "[레이드]",
        "ex_en": "She laid the baby gently on the bed.",
        "ex_ko": "그녀는 아기를 침대에 조심스럽게 눕혔다."
    },
    "woke": {
        "meaning": "깼다 / 깨웠다",
        "pron": "[워우크]",
        "ex_en": "I woke up early this morning.",
        "ex_ko": "나는 오늘 아침 일찍 잠에서 깼다."
    },
    "fallen": {
        "meaning": "떨어진 / 쓰러진",
        "pron": "[폴른]",
        "ex_en": "The streets were covered with fallen leaves.",
        "ex_ko": "거리마다 떨어진 낙엽으로 가득했다."
    },
    "hung": {
        "meaning": "걸었다 / 매달렸다",
        "pron": "[헝]",
        "ex_en": "She hung the picture on the wall.",
        "ex_ko": "그녀는 벽에 그림을 걸었다."
    },
    "spoken": {
        "meaning": "구어의 / 말로 한",
        "pron": "[스포큰]",
        "ex_en": "Spoken English is very important.",
        "ex_ko": "말하는 영어는 대단히 중요하다."
    },
    "blew": {
        "meaning": "불었다",
        "pron": "[블루]",
        "ex_en": "A strong wind blew across the lake.",
        "ex_ko": "호수 위로 거센 바람이 불었다."
    },
    "eaten": {
        "meaning": "먹힌 / 다 먹은",
        "pron": "[이튼]",
        "ex_en": "Have you eaten dinner already?",
        "ex_ko": "너는 벌써 저녁을 다 먹었니?"
    },
    "chosen": {
        "meaning": "선택된",
        "pron": "[초우즌]",
        "ex_en": "He was chosen as our class leader.",
        "ex_ko": "그는 우리 반의 반장으로 선택되었다."
    },
    "thrown": {
        "meaning": "던져진",
        "pron": "[스로운]",
        "ex_en": "The ball was thrown very high.",
        "ex_ko": "공이 매우 높이 던져졌다."
    },
    "fed": {
        "meaning": "먹였다 / 먹이를 준",
        "pron": "[페드]",
        "ex_en": "She fed the hungry dog.",
        "ex_ko": "그녀는 배고픈 강아지에게 밥을 주었다."
    },
    "drew": {
        "meaning": "그렸다",
        "pron": "[드루]",
        "ex_en": "The child drew a lovely picture.",
        "ex_ko": "그 아이는 사랑스러운 그림을 그렸다."
    },
    "mixed": {
        "meaning": "섞인 / 혼합된",
        "pron": "[믹스트]",
        "ex_en": "He had mixed feelings about the news.",
        "ex_ko": "그는 그 소식에 복잡한 감정이 들었다."
    },
    "bound": {
        "meaning": "묶인 / ~행의",
        "pron": "[바운드]",
        "ex_en": "This train is bound for Seoul.",
        "ex_ko": "이 열차는 서울행입니다."
    },
    "shown": {
        "meaning": "보여진 / 제시된",
        "pron": "[쇼운]",
        "ex_en": "The movie was shown on television.",
        "ex_ko": "그 영화는 텔레비전에서 상영되었다."
    },
    "wore": {
        "meaning": "입었다 / 썼다",
        "pron": "[워어]",
        "ex_en": "She wore a beautiful red dress.",
        "ex_ko": "그녀는 아름다운 빨간 드레스를 입었다."
    },
    "struck": {
        "meaning": "쳤다 / 감명을 준",
        "pron": "[스트럭]",
        "ex_en": "Lightning struck the tall tree.",
        "ex_ko": "번개가 그 큰 나무를 쳤다."
    },
    "frozen": {
        "meaning": "얼어붙은 / 냉동의",
        "pron": "[프로즌]",
        "ex_en": "The lake is completely frozen in winter.",
        "ex_ko": "겨울이 되면 호수가 완전히 얼어붙는다."
    },
    "blown": {
        "meaning": "날아간 / 바람에 날린",
        "pron": "[블로운]",
        "ex_en": "His hat was blown away by the wind.",
        "ex_ko": "그의 모자가 바람에 날아가 버렸다."
    },
    "drank": {
        "meaning": "마셨다",
        "pron": "[드랭크]",
        "ex_en": "He drank a glass of cold water.",
        "ex_ko": "그는 시원한 물 한 잔을 마셨다."
    },
    "mistaken": {
        "meaning": "잘못된 / 오해한",
        "pron": "[미스테이큰]",
        "ex_en": "You are mistaken about that matter.",
        "ex_ko": "당신은 그 문제에 대해 잘못 알고 있습니다."
    },
    "hid": {
        "meaning": "숨었다 / 숨겼다",
        "pron": "[히드]",
        "ex_en": "The cat hid under the soft bed.",
        "ex_ko": "고양이가 푹신한 침대 아래로 숨었다."
    },
    "flew": {
        "meaning": "날았다",
        "pron": "[플루]",
        "ex_en": "The birds flew south for the winter.",
        "ex_ko": "새들은 겨울을 나기 위해 남쪽으로 날아갔다."
    },
    "begun": {
        "meaning": "시작된",
        "pron": "[비건]",
        "ex_en": "The new school year has begun.",
        "ex_ko": "새 학년이 새롭게 시작되었다."
    },
    "driven": {
        "meaning": "운전된 / 추진된",
        "pron": "[드리븐]",
        "ex_en": "He is driven by great ambition.",
        "ex_ko": "그는 커다란 야망에 이끌리고 있다."
    },
    "sang": {
        "meaning": "노래했다",
        "pron": "[생]",
        "ex_en": "The choir sang beautifully in church.",
        "ex_ko": "성가대가 교회에서 아름답게 노래했다."
    },
    "burnt": {
        "meaning": "불탄 / 탄",
        "pron": "[번트]",
        "ex_en": "The toast was slightly burnt.",
        "ex_ko": "토스트가 약간 타 버렸다."
    },
    "drawn": {
        "meaning": "그려진 / 끌린",
        "pron": "[드론]",
        "ex_en": "The map was drawn by hand.",
        "ex_ko": "그 지도는 손으로 직접 그려졌다."
    },
    "forbidden": {
        "meaning": "금지된",
        "pron": "[포비든]",
        "ex_en": "Smoking is strictly forbidden here.",
        "ex_ko": "이곳에서는 흡연이 엄격히 금지됩니다."
    },
    "torn": {
        "meaning": "찢어진",
        "pron": "[톤]",
        "ex_en": "He wore a pair of torn jeans.",
        "ex_ko": "그는 찢어진 청바지를 입고 있었다."
    },
    "worn": {
        "meaning": "닳은 / 착용한",
        "pron": "[원]",
        "ex_en": "These old shoes are badly worn.",
        "ex_ko": "이 낡은 신발은 심하게 닳았다."
    },
    "lit": {
        "meaning": "불을 붙였다 / 밝아진",
        "pron": "[릿]",
        "ex_en": "She lit a candle in the dark room.",
        "ex_ko": "그녀는 어두운 방에서 촛불을 켰다."
    },
    "kent": {
        "meaning": "알았다 (고어)",
        "pron": "[켄트]",
        "ex_en": "I kent him when he was young.",
        "ex_ko": "나는 그가 어렸을 때 그를 알았다."
    },
    "dug": {
        "meaning": "팠다",
        "pron": "[더그]",
        "ex_en": "The dog dug a hole in the garden.",
        "ex_ko": "개가 정원에 구멍을 깊게 팠다."
    },
    "dad": {
        "meaning": "아빠 / 아버지",
        "pron": "[대드]",
        "ex_en": "Dad told me to get some rest.",
        "ex_ko": "아빠는 나에게 푹 쉬라고 말씀하셨다."
    },
    "mom": {
        "meaning": "엄마 / 어머니",
        "pron": "[맘]",
        "ex_en": "Mom made delicious soup for dinner.",
        "ex_ko": "엄마는 저녁으로 맛있는 수프를 만들어 주셨다."
    },
    "phone": {
        "meaning": "전화 / 전화기",
        "pron": "[폰]",
        "ex_en": "Please answer the phone right now.",
        "ex_ko": "지금 바로 전화를 받아 주세요."
    },
    "girl": {
        "meaning": "소녀 / 여자아이",
        "pron": "[걸]",
        "ex_en": "The young girl is reading a book.",
        "ex_ko": "그 어린 소녀는 책을 읽고 있다."
    },
    "girls": {
        "meaning": "소녀들 / 여자아이들",
        "pron": "[걸즈]",
        "ex_en": "The girls are playing soccer in the park.",
        "ex_ko": "소녀들이 공원에서 축구를 하고 있다."
    },
    "blue": {
        "meaning": "파란색 / 푸른",
        "pron": "[블루]",
        "ex_en": "The sky is clear and blue today.",
        "ex_ko": "오늘 하늘은 맑고 푸르다."
    },
    "gives": {
        "meaning": "준다 / 제공한다",
        "pron": "[기브스]",
        "ex_en": "He gives a present to his mother.",
        "ex_ko": "그는 어머니께 선물을 드린다."
    },
    "command": {
        "meaning": "명령하다 / 지휘하다",
        "pron": "[커맨드]",
        "ex_en": "The officer gave a clear command.",
        "ex_ko": "장교는 명확한 명령을 내렸다."
    },
    "windows": {
        "meaning": "창문들",
        "pron": "[윈도우즈]",
        "ex_en": "Please open the windows for fresh air.",
        "ex_ko": "신선한 공기를 위해 창문들을 열어 주세요."
    },
    "unlike": {
        "meaning": "와 다른 / 같지 않은",
        "pron": "[언라이크]",
        "ex_en": "Unlike his brother he enjoys sports.",
        "ex_ko": "그의 형과 달리 그는 스포츠를 즐긴다."
    },
    "lend": {
        "meaning": "빌려주다",
        "pron": "[렌드]",
        "ex_en": "Can you lend me your pencil please?",
        "ex_ko": "연필 좀 빌려줄 수 있나요?"
    },
    "belly": {
        "meaning": "배 / 복부",
        "pron": "[벨리]",
        "ex_en": "The puppy rolled over on its belly.",
        "ex_ko": "강아지가 배를 보이며 뒹굴었다."
    },
    "fond": {
        "meaning": "좋아하는 / 애정 어린",
        "pron": "[폰드]",
        "ex_en": "She is very fond of sweet chocolate.",
        "ex_ko": "그녀는 달콤한 초콜릿을 아주 좋아한다."
    },
    "caesar": {
        "meaning": "시저 / 황제",
        "pron": "[시저]",
        "ex_en": "Julius Caesar was a famous Roman leader.",
        "ex_ko": "율리우스 시저는 유명한 로마의 지도자였다."
    },
    "acid": {
        "meaning": "산성의 / 신맛의",
        "pron": "[애시드]",
        "ex_en": "Lemon juice has a strong acid taste.",
        "ex_ko": "레몬 주스는 강한 신맛이 난다."
    },
    "has": {
        "meaning": "가지고 있다 / 있다",
        "pron": "[해즈]",
        "ex_en": "He has a friendly dog.",
        "ex_ko": "그는 다정한 강아지를 한 마리 키우고 있다."
    },
    "does": {
        "meaning": "하다 / 행하다",
        "pron": "[더즈]",
        "ex_en": "She does her best every day.",
        "ex_ko": "그녀는 매일 최선을 다한다."
    },
    "men": {
        "meaning": "남자들 / 사람들",
        "pron": "[멘]",
        "ex_en": "The men worked hard together.",
        "ex_ko": "그 남자들은 함께 열심히 일했다."
    },
    "says": {
        "meaning": "말한다",
        "pron": "[세즈]",
        "ex_en": "The sign says stop here.",
        "ex_ko": "표지판에 여기서 멈추라고 적혀 있다."
    },
    "children": {
        "meaning": "어린이들 / 아이들",
        "pron": "[칠드런]",
        "ex_en": "The children are laughing happily.",
        "ex_ko": "아이들이 행복하게 웃고 있다."
    },
    "goes": {
        "meaning": "간다",
        "pron": "[고우즈]",
        "ex_en": "He goes to work by subway.",
        "ex_ko": "그는 지하철을 타고 출근한다."
    },
    "women": {
        "meaning": "여성들 / 여자들",
        "pron": "[위민]",
        "ex_en": "Many women attended the meeting.",
        "ex_ko": "많은 여성들이 그 회의에 참석했다."
    },
    "shot": {
        "meaning": "발사 / 주사 / 시도",
        "pron": "[샷]",
        "ex_en": "He gave it his best shot.",
        "ex_ko": "그는 최선을 다해 시도했다."
    },
    "met": {
        "meaning": "만났다",
        "pron": "[멧]",
        "ex_en": "We met at the coffee shop yesterday.",
        "ex_ko": "우리는 어제 카페에서 만났다."
    },
    "lives": {
        "meaning": "삶들 / 생명들",
        "pron": "[라이브스]",
        "ex_en": "Doctors save many lives every day.",
        "ex_ko": "의사들은 매일 많은 생명을 구한다."
    },
    "sex": {
        "meaning": "성별 / 성",
        "pron": "[섹스]",
        "ex_en": "Please state your age and sex.",
        "ex_ko": "연령과 성별을 기재해 주세요."
    },
    "feet": {
        "meaning": "발들 / 피트 (길이 단위)",
        "pron": "[피트]",
        "ex_en": "My feet are cold in the snow.",
        "ex_ko": "눈 속에서 내 발이 시리다."
    },
    "ice": {
        "meaning": "얼음 / 빙판",
        "pron": "[아이스]",
        "ex_en": "Please put some ice in my drink.",
        "ex_ko": "제 음료에 얼음을 좀 넣어 주세요."
    },
    "art": {
        "meaning": "예술 / 미술",
        "pron": "[아트]",
        "ex_en": "She loves modern art and painting.",
        "ex_ko": "그녀는 현대 미술과 회화를 사랑한다."
    },
    "leaves": {
        "meaning": "나뭇잎들 / 잎들",
        "pron": "[리브스]",
        "ex_en": "The green leaves turn red in autumn.",
        "ex_ko": "가을이 되면 초록 잎들이 붉게 변한다."
    },
    "teeth": {
        "meaning": "이빨들 / 치아",
        "pron": "[티스]",
        "ex_en": "Brush your teeth twice a day.",
        "ex_ko": "하루에 두 번 이를 닦으세요."
    },
    "post": {
        "meaning": "게시물 / 우편 / 기둥",
        "pron": "[포스트]",
        "ex_en": "He shared a new post online.",
        "ex_ko": "그는 온라인에 새로운 게시물을 공유했다."
    },
    "media": {
        "meaning": "대중 매체 / 미디어",
        "pron": "[미디어]",
        "ex_en": "The news media covered the big event.",
        "ex_ko": "뉴스 매체가 그 큰 행사를 취재했다."
    },
    "pen": {
        "meaning": "펜 / 필기구",
        "pron": "[펜]",
        "ex_en": "I wrote the letter with a blue pen.",
        "ex_ko": "나는 파란 펜으로 편지를 썼다."
    },
    "wives": {
        "meaning": "아내들 / 부인들",
        "pron": "[와이브스]",
        "ex_en": "The wives met for lunch today.",
        "ex_ko": "아내들이 오늘 점심 식사를 위해 모였다."
    },
    "sales": {
        "meaning": "매출 / 판매",
        "pron": "[세일즈]",
        "ex_en": "Company sales increased this year.",
        "ex_ko": "올해 회사 매출이 증가했다."
    },
    "yourselves": {
        "meaning": "너희들 자신 / 여러분 스스로",
        "pron": "[유어셀브스]",
        "ex_en": "Please help yourselves to some food.",
        "ex_ko": "음식을 마음껏 가져다 드세요."
    },
    "thieves": {
        "meaning": "도둑들",
        "pron": "[시브스]",
        "ex_en": "The police caught the thieves quickly.",
        "ex_ko": "경찰이 도둑들을 신속히 체포했다."
    },
    "pan": {
        "meaning": "냄비 / 프라이팬",
        "pron": "[팬]",
        "ex_en": "Cook the eggs in a hot pan.",
        "ex_ko": "뜨거운 프라이팬에 달걀을 요리하세요."
    },
    "counter": {
        "meaning": "계산대 / 카운터",
        "pron": "[카운터]",
        "ex_en": "Pay for the goods at the counter.",
        "ex_ko": "계산대에서 물건값을 지불하세요."
    },
    "con": {
        "meaning": "속임수 / 사기",
        "pron": "[콘]",
        "ex_en": "It turned out to be a clever con.",
        "ex_ko": "그것은 교묘한 속임수로 드러났다."
    },
    "taxes": {
        "meaning": "세금들",
        "pron": "[택시스]",
        "ex_en": "Citizens pay taxes to the government.",
        "ex_ko": "시민들은 정부에 세금을 납부한다."
    },
    "wolves": {
        "meaning": "늑대들",
        "pron": "[울브스]",
        "ex_en": "The wolves ran across the cold forest.",
        "ex_ko": "늑대들이 차가운 숲속을 가로질러 달렸다."
    },
    "un": {
        "meaning": "부정 접두사 (반대)",
        "pron": "[언]",
        "ex_en": "The word happy becomes unhappy with un.",
        "ex_ko": "happy 단어에 un이 붙으면 unhappy가 된다."
    },
    "ally": {
        "meaning": "동맹 / 동맹국",
        "pron": "[앨라이]",
        "ex_en": "They stood as a loyal ally in times of need.",
        "ex_ko": "그들은 필요할 때 충실한 동맹으로 함께했다."
    },
    "wise": {
        "meaning": "현명한 / 지혜로운",
        "pron": "[와이즈]",
        "ex_en": "She gave me some wise advice.",
        "ex_ko": "그녀는 나에게 현명한 조언을 해 주었다."
    },
    "el": {
        "meaning": "엘 (인명)",
        "pron": "[엘]",
        "ex_en": "El is a short nickname for Eleanor.",
        "ex_ko": "엘은 엘리너의 짧은 애칭이다."
    },
    "ian": {
        "meaning": "이안 (인명)",
        "pron": "[이안]",
        "ex_en": "Ian is my good friend from school.",
        "ex_ko": "이안은 학교에서 만난 내 좋은 친구이다."
    },
    "le": {
        "meaning": "르 (프랑스어 관사)",
        "pron": "[르]",
        "ex_en": "Le is the French word for the.",
        "ex_ko": "Le는 프랑스어로 the에 해당하는 단어이다."
    },
    "st": {
        "meaning": "거리 (Street) / 성자 (Saint)",
        "pron": "[세인트]",
        "ex_en": "Turn left on Main St to find the bank.",
        "ex_ko": "은행을 찾으려면 메인 거리에서 좌회전하세요."
    },
    "al": {
        "meaning": "알 (인명)",
        "pron": "[알]",
        "ex_en": "Al is short for Albert or Alexander.",
        "ex_ko": "알은 앨버트 또는 알렉산더의 줄임말이다."
    },
    "maria": {
        "meaning": "마리아 (인명)",
        "pron": "[마리아]",
        "ex_en": "Maria sings beautifully in the choir.",
        "ex_ko": "마리아는 성가대에서 아름답게 노래한다."
    }
}

def clean_meaning(raw, word=None):
    if not raw:
        return ""
    w = (word or "").lower()
    if w == "of":
        return "~의"
    if w in ("computer", "computers") or "계산자" in raw:
        return "계산기"
    if w == "fifty":
        return "오십"
    if w == "fifteen":
        return "십오"
    if w == "hop":
        return "뛰다"
    if w == "growls":
        return "으르렁거리다"
    if w == "sara":
        return "사라"

    # 1. 동사/형용사 접미사 분절 결합: ([가-힣]+)\s*/\s*(하다|되다|시키다|받다|거리다)
    def repl(m):
        prefix = m.group(1).strip()
        suffix = m.group(2).strip()
        if prefix.endswith("다"):
            return m.group(0)
        if prefix.endswith("를") or prefix.endswith("을"):
            return prefix[:-1] + suffix
        if prefix.endswith("게") or prefix.endswith("로") or prefix.endswith("히"):
            return prefix + " " + suffix
        return prefix + suffix

    s = re.sub(r"([가-힣]+)\s*/\s*(하다|되다|시키다|받다|거리다)", repl, raw)

    # 2. 다의어 슬래시 분절 -> 첫 번째 대표 뜻 단 1개만 추출
    tokens = [t.strip() for t in s.split("/") if t.strip()]
    if not tokens:
        return ""
    first = tokens[0]

    # 3. 쉼표(,), 슬래시(/), 괄호 설명 완전 정리 및 물결표(~) 제거
    first = re.sub(r"〈[^〉]*〉|〔[^〕]*〕|《[^》]*》|【[^】]*】|『[^』]*』|（[^）]*）|\([^)]*\)|\[[^\]]*\]|<[^>]*>|\{[^}]*\}", "", first)
    first = re.sub(r"[①②③④⑤⑥⑦⑧⑨⑩¹²³⁴⁵·]+", "", first)
    first = re.sub(r"~+\s*", "", first)
    first = re.sub(r"[()（）\[\]{}<>·,\'\"…\.]", "", first).strip()

    if not first and len(tokens) > 1:
        fallback = tokens[1]
        fallback = re.sub(r"〈[^〉]*〉|〔[^〕]*〕|《[^》]*》|【[^】]*】|『[^』]*』|（[^）]*）|\([^)]*\)|\[[^\]]*\]|<[^>]*>|\{[^}]*\}", "", fallback)
        fallback = re.sub(r"[①②③④⑤⑥⑦⑧⑨⑩¹²³⁴⁵·]+", "", fallback)
        fallback = re.sub(r"~+\s*", "", fallback)
        fallback = re.sub(r"[()（）\[\]{}<>·,\'\"…\.]", "", fallback).strip()
        first = fallback

    words = [wd for wd in first.split() if wd not in ["의", "과거", "분사형", "과거형", "타동사", "자동사", "형용사", "명사", "부사"]]
    if words:
        first = " ".join(words)

    return first.replace(",", " ").replace("/", " ").replace("~", "").strip()

def clean_pron(raw):
    if not raw:
        return ""
    clean = raw.strip().lstrip("[").rstrip("]").strip()
    return f"[{clean}]" if clean else ""

def clean_ex_en(raw):
    if not raw:
        return ""
    s = re.sub(r"\[[^\]]*\]|〈[^〉]*〉|〔[^〕]*〕", "", raw)
    s = re.sub(r"\(\s*\.\s*,?", "", s)
    s = s.replace(",", " ")
    s = " ".join(s.split()).strip()
    if s and not s.endswith((".", "!", "?")):
        s += "."
    return s

def clean_ex_ko(raw):
    if not raw:
        return ""
    # 사전 번호 및 속성 꼬리표 절삭
    cut_pattern = re.compile(
        r"(?:\s+\d+\.|\s+[②③④⑤⑥⑦⑧⑨⑩]|\s*숙어\b|\s*형용사\s*\d*|\s*동사\s*|\s*명사\s*|\s*부사\s*|\s*※|\s*while\s+the\b|\s*〔\…|\s*〈[가-힣]+〉\s*고용된|\s*〈가다〉).*"
    )
    s = cut_pattern.sub("", raw)
    s = re.sub(r"〈[^〉]*〉|〔[^〕]*〕|《[^》]*》|【[^】]*】|『[^』]*』|（[^）]*）|\([^)]*\)|\[[^\]]*\]", "", s)
    s = re.sub(r"[①②③④⑤⑥⑦⑧⑨⑩¹²³⁴⁵·]+", "", s)
    s = re.sub(r"\(\s*\.\s*,?", "", s)
    s = s.replace(",", " ")
    s = " ".join(s.split()).strip()
    if s and not s.endswith((".", "!", "?")):
        s += "."
    return s

def refine_master_csv():
    if not os.path.exists(INPUT_CSV):
        print(f"❌ 오류: {INPUT_CSV} 파일이 없습니다.")
        return

    shutil.copyfile(INPUT_CSV, BACKUP_CSV)
    print(f"📦 안전 백업 생성 완료: {BACKUP_CSV}")

    refined_rows = []
    header = None
    curated_count = 0
    cleaned_count = 0

    with open(INPUT_CSV, mode="r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if not row or not any(field.strip() for field in row):
                continue
            if i == 0 and ("Rank" in row[0] or "word" in row[1].lower()):
                header = row
                refined_rows.append(row)
                continue

            while len(row) < 9:
                row.append("")

            rank = row[0].strip()
            word = row[1].strip()
            level = row[2].strip()
            unit_id = row[3].strip()
            node_id = row[4].strip()
            meaning = row[5].strip()
            pron = row[6].strip()
            ex_en = row[7].strip()
            ex_ko = row[8].strip()

            w_lower = word.lower()

            # 1. 큐레이션 사전 적용
            if w_lower in CURATED_WORDS:
                c = CURATED_WORDS[w_lower]
                meaning = clean_meaning(c["meaning"], w_lower)
                pron = c["pron"]
                ex_en = c["ex_en"]
                ex_ko = c["ex_ko"]
                curated_count += 1
            else:
                meaning = clean_meaning(meaning, w_lower)
                pron = clean_pron(pron)
                ex_en = clean_ex_en(ex_en)
                ex_ko = clean_ex_ko(ex_ko)
                cleaned_count += 1

            # 쉼표 전면 배제 (CSV 무결성)
            meaning = meaning.replace(",", " ")
            ex_en = ex_en.replace(",", " ")
            ex_ko = ex_ko.replace(",", " ")

            refined_rows.append([
                rank, word, level, unit_id, node_id,
                meaning, pron, ex_en, ex_ko
            ])

    with open(INPUT_CSV, mode="w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(refined_rows)

    print(f"✅ 정제 완료: 큐레이션 적용 {curated_count}개, 일반 정제 {cleaned_count}개")
    print(f"💾 {INPUT_CSV} 저장 완료.")

if __name__ == "__main__":
    refine_master_csv()
