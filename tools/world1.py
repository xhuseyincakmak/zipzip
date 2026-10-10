"""Çayır temalı 4 bölüm. Çalıştır: python3 tools/world1.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from levelkit import Level, GROUND, SLUGS

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'levels')
G = GROUND


def level_1_1():
    L = Level(178, 'Yeşil Başlangıç', 'grass', 'hills', 300)
    L.ground(0, 44).put(3, G - 1, 'S')
    L.put(7, G - 1, 'b').put(8, G - 1, 'b')
    L.put(11, 6, '?')
    L.row(15, 6, 'BMB?B').put(17, 2, '?')
    L.put(23, G - 1, 'E')
    L.fill(27, 28, 8, 9)                      # alçak tümsek
    L.put(32, G - 1, 'E').put(34, G - 1, 'E')
    L.fill(38, 39, 7, 9)                      # yüksek tümsek
    L.coins(40, 43, 5)
    # 2 karolik ilk çukur
    L.ground(47, 90)
    L.coins(45, 46, 7)
    L.row(52, 6, 'BBB?BBBBBBB')               # uzun tuğla sırası
    L.put(62, 2, '*')                          # tuğlaların üstünden zıplayınca yıldız
    L.coins(53, 57, 4)
    L.put(60, G - 1, 'E').put(64, G - 1, 'E')
    L.put(70, G - 1, 'K')
    L.put(76, G - 1, 'C').put(78, G - 1, 'm')
    L.fill(83, 84, 8, 9)
    L.put(87, G - 1, 'E')
    # 3 karolik çukur, üstünde coin yayı
    L.coins(91, 93, 6)
    L.ground(94, 178)
    L.ground(103, 111, 7)                     # yüksek düzlük
    L.coins(104, 110, 5).put(108, 6, 'E')
    L.put(118, G - 1, 'b')
    L.row(121, 6, 'B?BMB')
    L.put(126, G - 1, 'E').put(128, G - 1, 'E').put(134, G - 1, 'K')
    L.row(139, 5, '???')
    L.put(144, G - 1, 'E')
    L.stairs_up(150, 8)
    L.put(165, G - 1, 'F').put(162, G - 1, 'b')
    return L


def level_1_2():
    L = Level(186, 'Orman Patikası', 'dirt', 'trees', 300)
    L.ground(0, 30).put(3, G - 1, 'S')
    L.put(8, 6, '?').put(12, 6, 'M')
    L.fill(17, 24, 8, 9).fill(21, 24, 6, 7)   # iki basamaklı tepe
    L.coins(21, 24, 4).put(19, 7, 'E')
    # 4 karolik çukur, ortasında tek basamak
    L.fill(32, 33, 8, 8)
    L.ground(35, 70)
    L.put(40, G - 1, 'K').put(45, G - 1, 'E').put(47, G - 1, 'E')
    L.row(50, 6, 'B?BBBBBB?B')
    L.row(52, 2, 'BB*BB')
    L.coins(53, 57, 5)
    L.put(63, G - 1, 'E')
    L.put(66, G - 1, 'C')
    L.fill(72, 72, 8, 8)                       # çukur üstünde tek taş
    L.ground(75, 112)
    L.fill(80, 80, 6, 9).put(80, 5, 'o')      # sütunlar
    L.fill(86, 87, 7, 9).put(86, 6, 'E')
    L.fill(93, 93, 7, 9).fill(94, 95, 6, 9)
    L.coins(94, 95, 3)
    L.put(100, G - 1, 'E').put(103, G - 1, 'E').put(106, G - 1, 'K')
    L.coins(113, 115, 7)
    L.ground(116, 186)
    L.row(120, 6, 'BBMBB')
    L.put(124, G - 1, 'E').put(126, G - 1, 'E').put(128, G - 1, 'E')
    L.fill(134, 141, 8, 9).coins(134, 141, 6)
    L.put(138, 7, 'K')
    L.row(146, 6, '?B?B?')
    L.put(152, G - 1, 'E')
    L.stairs_up(158, 7)
    L.put(173, G - 1, 'F')
    return L


def level_1_3():
    L = Level(170, 'Mantar Tepeleri', 'grass', 'mushrooms', 300)
    L.ground(0, 12).put(3, G - 1, 'S').put(9, 6, 'M')
    plats = [  # (x0, x1, y) tek sıra platformlar, aradaki çukurlar 2-3 karo
        (15, 19, 8), (22, 25, 6), (29, 34, 7), (38, 40, 5), (43, 48, 7), (52, 57, 9),
    ]
    for x0, x1, y in plats:
        L.fill(x0, x1, y, y).coins(x0, x1, y - 2)
    L.put(32, 6, 'E').put(46, 6, 'E')
    L.put(31, 3, '?')
    # Ortada güvenli ada ve checkpoint
    L.ground(60, 72).put(65, G - 1, 'C').row(67, 6, 'B*B')
    L.put(71, G - 1, 'E')
    plats2 = [(76, 79, 8), (83, 85, 6), (88, 92, 4), (96, 100, 7), (104, 107, 9),
              (110, 114, 7), (118, 121, 5), (125, 130, 8)]
    for x0, x1, y in plats2:
        L.fill(x0, x1, y, y).coins(x0, x1, y - 2)
    L.put(98, 6, 'E').put(112, 6, 'K').put(128, 7, 'E')
    L.put(90, 0, '?')
    L.ground(134, 170)
    L.put(140, G - 1, 'E').put(142, G - 1, 'E')
    L.stairs_up(146, 4)
    L.ground(150, 155, 6)
    L.put(160, G - 1, 'F')
    return L


def level_1_4():
    L = Level(176, 'Taş Kale', 'stone', 'hills', 300)
    L.ground(0, 176).put(3, G - 1, 'S')
    L.fill(0, 176, 0, 0, 'X')                  # tavan
    L.row(10, 6, '?M?')
    L.row(16, 5, 'BBBBBBBB')                   # alçak koridor (büyükken kırılır)
    L.put(19, G - 1, 'E').put(22, G - 1, 'E')
    L.stairs_up(28, 3).fill(31, 34, 7, 9, 'X').stairs_down(35, 3)
    L.put(33, 6, 'K')
    L.fill(41, 43, 10, 11, ' ')                # çukur
    L.coins(41, 43, 7)
    L.row(48, 6, 'BBB*BBB')
    L.put(52, G - 1, 'E').put(55, G - 1, 'E').put(58, G - 1, 'E')
    L.fill(62, 63, 7, 9, 'X')
    L.put(67, G - 1, 'K')
    L.fill(71, 74, 10, 11, ' ').fill(72, 73, 7, 7, 'X')
    L.put(80, G - 1, 'C')
    L.row(84, 5, 'BBBBBBBBBBBB').coins(85, 94, 8)
    L.put(88, G - 1, 'E').put(91, G - 1, 'E').put(94, G - 1, 'K')
    L.fill(100, 102, 10, 11, ' ')
    L.stairs_up(106, 4).fill(110, 115, 6, 9, 'X')
    L.put(113, 5, 'E').coins(110, 115, 3)
    L.fill(116, 119, 10, 11, ' ')
    L.row(123, 6, 'B?B?B')
    L.put(128, G - 1, 'E').put(130, G - 1, 'E').put(132, G - 1, 'E').put(136, G - 1, 'K')
    L.fill(141, 143, 10, 11, ' ')
    L.stairs_up(148, 6)
    L.fill(0, 176, 0, 0, ' ').fill(0, 140, 0, 0, 'X')  # sona doğru tavan açılır
    L.put(163, G - 1, 'F')
    return L


if __name__ == '__main__':
    for lid, fn in [('1-1', level_1_1), ('1-2', level_1_2), ('1-3', level_1_3), ('1-4', level_1_4)]:
        fn().write(os.path.join(OUT, f'{SLUGS[lid]}.txt'))
