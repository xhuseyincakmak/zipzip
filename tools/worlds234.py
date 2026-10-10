"""Mağara, gökyüzü ve kale temalı 12 bölüm. Çalıştır: python3 tools/worlds234.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from levelkit import Level, GROUND, SLUGS

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'levels')
G = GROUND


# ------------------------------------------------------------ Dünya 2: Yeraltı Mağaraları

def l2_1():
    L = Level(180, 'Çöl Kapısı', 'sand', 'desert', 300)
    L.ground(0, 179).put(3, G - 1, 'S')
    L.row(9, 6, '?M?').put(18, G - 1, 'E').put(21, G - 1, 'E')
    L.stairs_up(26, 3).stairs_down(29, 3)
    L.pit(36, 38).coins(36, 38, 7)
    L.put(44, G - 1, 'K').put(52, 6, 'Y')
    L.row(56, 6, 'BB?BB*B').coins(57, 61, 4)
    L.pit(66, 69).coins(66, 69, 7)
    L.put(76, G - 1, 'C').put(84, 7, 'A').put(90, 6, 'A')
    L.ground(94, 102, 7).coins(95, 101, 5)
    L.row(105, G - 1, '^^').put(110, G - 1, 'E').put(112, G - 1, 'E')
    L.pit(116, 119).coins(116, 119, 6)
    L.stairs_up(126, 4).ground(130, 136, 6).put(133, 5, 'E')
    L.put(142, G - 1, 'K').row(146, 6, 'B?B?B')
    L.put(166, G - 1, 'F')
    return L


def l2_2():
    L = Level(182, 'Mor Mağara', 'purple', 'cave', 300)
    L.ground(0, 181).ceiling(0, 160).put(3, G - 1, 'S')
    L.row(8, 6, 'M??').put(16, G - 1, 'E')
    L.ceiling(20, 34, 4).row(22, 7, 'BBBBBBBBB').coins(22, 30, 9)   # alçak tavan
    L.put(28, G - 1, 'E').put(32, G - 1, 'E')
    L.pit(38, 40).put(46, G - 1, 'W')
    L.fill(52, 53, 7, 9).fill(58, 59, 6, 9).put(58, 5, 'o').put(59, 5, 'o')
    L.put(64, G - 1, 'K').pit(70, 73).coins(70, 73, 7)
    L.put(78, G - 1, 'C').row(82, 6, 'B*BBB?B')
    L.row(86, G - 1, '^^^').fill(85, 85, 9, 9, '#').fill(89, 89, 9, 9, '#')
    L.put(95, G - 1, 'W').put(102, G - 1, 'E').put(104, G - 1, 'E')
    L.ceiling(108, 124, 5).coins(110, 122, 7).put(116, G - 1, 'K')
    L.pit(128, 131).stairs_up(136, 4).fill(140, 144, 6, 9).put(142, 5, 'E')
    L.put(150, G - 1, 'W')
    L.put(170, G - 1, 'F')
    return L


def l2_3():
    L = Level(182, 'Sarkıt Geçidi', 'purple', 'cave', 300)
    L.ground(0, 181).ceiling(0, 165).put(3, G - 1, 'S').row(9, 6, '?M')
    L.pit(16, 24).put(18, 8, '=').coins(17, 23, 6)
    L.put(30, G - 1, 'E').put(33, G - 1, 'E').put(38, 6, 'Y')
    L.pit(42, 51).put(45, 7, '=').put(47, 3, '?')
    L.put(57, G - 1, 'K').row(60, 6, 'BB?BB')
    L.pit(66, 72).put(68, 6, '|').coins(66, 72, 3)
    L.put(78, G - 1, 'C').put(84, 6, 'Y').put(90, G - 1, 'W')
    L.pit(96, 106).put(99, 8, '=').put(104, 5, 'Y')
    L.put(112, G - 1, 'E').put(114, G - 1, 'E').row(118, 6, '*BB')
    L.pit(124, 131).put(126, 6, '|').coins(124, 131, 2)
    L.stairs_up(138, 5).put(150, G - 1, 'E')
    L.put(170, G - 1, 'F')
    return L


def l2_4():
    L = Level(180, 'Diken Tüneli', 'stone', 'cave', 300)
    L.ground(0, 179).ceiling(0, 160, 1, 'X').put(3, G - 1, 'S').row(8, 6, '?M?')
    L.row(16, G - 1, '^^^^').fill(15, 15, 9, 9, 'X').fill(20, 20, 9, 9, 'X').fill(16, 19, 6, 6)
    L.coins(16, 19, 4).put(26, G - 1, 'E').put(30, G - 1, 'W')
    L.pit(36, 39).put(44, 7, 'A').put(48, G - 1, 'K')
    L.row(54, G - 1, '^^^^^^').put(54, 7, '=').coins(54, 59, 5)
    L.put(66, G - 1, 'C').row(70, 6, 'BB*BB').put(72, G - 1, 'E').put(74, G - 1, 'E')
    L.pit(80, 84).put(82, 3, 'A')
    L.row(90, G - 1, '^^^').stairs_up(86, 3).stairs_down(93, 3).put(91, 5, 'o')
    L.put(100, G - 1, 'W').put(106, G - 1, 'W')
    L.row(112, G - 1, '^^^^^').put(111, 6, '|').coins(112, 116, 3)
    L.put(124, G - 1, 'K').pit(130, 133).put(138, 6, 'A')
    L.stairs_up(144, 4).put(156, G - 1, 'E')
    L.put(168, G - 1, 'F')
    return L


# ------------------------------------------------------------ Dünya 3: Gökyüzü Adaları

def l3_1():
    L = Level(180, 'Bulut Yolu', 'snow', 'hills', 300)
    L.ground(0, 14).put(3, G - 1, 'S').row(8, 6, '?M')
    for x0, x1, y in [(18, 22, 8), (26, 29, 6)]:
        L.fill(x0, x1, y, y).coins(x0, x1, y - 2)
    L.put(33, 7, '=').put(32, 3, 'Y')
    L.ground(42, 58).put(48, G - 1, 'E').put(52, G - 1, 'E').row(46, 6, 'B*B')
    L.put(62, 8, '=').put(68, 5, 'Y')
    L.ground(74, 86).put(78, G - 1, 'C').put(82, G - 1, 'K')
    for x0, x1, y in [(90, 93, 7), (97, 99, 5), (103, 107, 7)]:
        L.fill(x0, x1, y, y).coins(x0, x1, y - 2)
    L.put(105, 6, 'E').put(111, 7, '=').put(116, 4, 'Y')
    L.ground(122, 179).put(128, G - 1, 'E').put(131, G - 1, 'E').row(134, 6, '?B?')
    L.stairs_up(144, 6)
    L.put(166, G - 1, 'F')
    return L


def l3_2():
    L = Level(184, 'Karlı Zirve', 'snow', 'trees', 300)
    L.ground(0, 183).put(3, G - 1, 'S').row(9, 6, 'M?')
    L.ground(16, 26, 8).ground(20, 26, 6).put(23, 5, 'E').coins(20, 26, 3)
    L.pit(29, 32).put(36, 6, 'A').put(40, 5, 'A')
    L.ground(44, 54, 7).put(48, 6, 'K').pit(57, 60)
    L.put(66, G - 1, 'E').put(68, G - 1, 'E').row(70, 6, 'BBB*BBB')
    L.put(80, G - 1, 'C').ground(84, 92, 8).ground(87, 92, 6).ground(90, 92, 4)
    L.coins(90, 92, 2).pit(95, 98).put(97, 6, 'A')
    L.put(104, G - 1, 'K').put(110, G - 1, 'E').put(112, G - 1, 'E')
    L.ground(118, 130, 7).put(124, 6, 'E').pit(133, 137).put(134, 7, '=')
    L.put(144, G - 1, 'A').stairs_up(150, 7)
    L.put(172, G - 1, 'F')
    return L


def l3_3():
    L = Level(180, 'Rüzgâr Köprüleri', 'snow', 'hills', 300)
    L.ground(0, 12).put(3, G - 1, 'S').put(9, 6, 'M')
    L.pit(13, 179)
    L.put(16, 6, '|').coins(16, 18, 2)
    L.fill(23, 26, 7, 7).put(24, 6, 'E')
    L.put(30, 8, '=').put(36, 4, 'Y')
    L.fill(40, 43, 7, 7).put(41, 3, '?')
    L.put(48, 5, '|')
    L.ground(55, 66).put(58, G - 1, 'C').row(60, 6, 'B*B').put(64, G - 1, 'E')
    L.put(70, 7, '=').put(76, 4, 'Y')
    L.fill(79, 82, 6, 6).coins(79, 82, 4).put(86, 6, '|').put(95, 3, 'Y')
    L.fill(93, 96, 7, 7).put(94, 6, 'E')
    L.put(103, 8, '=').fill(112, 115, 6, 6).coins(112, 115, 4)
    L.put(119, 5, '|').put(126, 7, '=')
    L.ground(134, 179).put(140, G - 1, 'K').stairs_up(148, 5)
    L.put(166, G - 1, 'F')
    return L


def l3_4():
    L = Level(182, 'Yıldız Kulesi', 'snow', 'trees', 300)
    L.ground(0, 181).put(3, G - 1, 'S').row(8, 6, '?M?')
    L.stairs_up(16, 4).fill(20, 25, 6, 9, 'X').put(22, 5, 'W')
    L.stairs_down(26, 4).put(34, G - 1, 'E').put(36, G - 1, 'E')
    L.pit(40, 43).put(41, 7, 'Y').row(48, 6, 'B*BB?B')
    L.put(56, G - 1, 'W').put(64, G - 1, 'K')
    L.put(70, G - 1, 'C').stairs_up(76, 3).fill(79, 90, 7, 9, 'X')
    L.put(83, 6, 'W').coins(80, 89, 4).stairs_down(91, 3)
    L.pit(97, 101).put(99, 8, '=').put(108, 6, 'A').put(112, 4, 'A')
    L.put(118, G - 1, 'E').put(120, G - 1, 'E').put(122, G - 1, 'E')
    L.row(126, 6, '?B?B?').put(134, G - 1, 'W')
    L.stairs_up(144, 8).put(170, G - 1, 'F')
    return L


# ------------------------------------------------------------ Dünya 4: Ateş Kalesi

def l4_1():
    L = Level(180, 'Lav Kapısı', 'stone', 'cave', 350)
    L.ground(0, 179).ceiling(0, 160, 1, 'X').put(3, G - 1, 'S').row(9, 6, '?M?')
    L.pit(18, 20, lava=True).put(26, G - 1, 'E').put(29, G - 1, 'E')
    L.pit(34, 37, lava=True).coins(34, 37, 7).fill(42, 43, 7, 9, 'X')
    L.put(48, G - 1, 'K').row(52, 6, 'BB*BB').pit(58, 61, lava=True)
    L.put(66, G - 1, 'C').put(72, G - 1, 'W').ceiling(76, 92, 5, 'X')
    L.put(80, G - 1, 'E').put(84, G - 1, 'E').put(88, G - 1, 'E').coins(78, 90, 7)
    L.pit(96, 100, lava=True).put(98, 8, '=')
    L.put(106, 6, 'A').put(112, G - 1, 'K').pit(118, 121, lava=True)
    L.stairs_up(128, 4).fill(132, 138, 6, 9, 'X').put(135, 5, 'E').stairs_down(139, 4)
    L.put(166, G - 1, 'F')
    return L


def l4_2():
    L = Level(180, 'Testere Salonu', 'stone', 'cave', 350)
    L.ground(0, 179).ceiling(0, 162, 1, 'X').put(3, G - 1, 'S').row(9, 6, 'M??')
    L.put(18, G - 1, 'W').put(26, G - 1, 'W')
    L.row(32, G - 1, '^^^').fill(32, 34, 6, 6, 'X').coins(32, 34, 4)
    L.pit(40, 43, lava=True).put(48, 6, 'W').fill(46, 50, 7, 7, 'X')
    L.put(56, G - 1, 'E').put(58, G - 1, 'E').row(62, 6, 'B*B')
    L.put(70, G - 1, 'C').put(76, G - 1, 'W').put(80, 5, 'A')
    L.pit(86, 89, lava=True).put(94, G - 1, 'K').put(100, G - 1, 'W')
    L.row(106, G - 1, '^^^^').put(105, 7, '=').put(114, 6, 'A')
    L.pit(120, 123, lava=True).put(128, G - 1, 'W').put(134, G - 1, 'E')
    L.stairs_up(140, 5).put(166, G - 1, 'F')
    return L


def l4_3():
    L = Level(182, 'Erimiş Köprüler', 'stone', 'cave', 350)
    L.ground(0, 181).ceiling(0, 165, 1, 'X').put(3, G - 1, 'S').row(9, 6, '?M')
    L.pit(16, 25, lava=True).put(18, 8, '=').coins(17, 24, 6)
    L.put(30, G - 1, 'E').put(32, G - 1, 'E')
    L.pit(38, 47, lava=True).put(40, 6, '|').put(45, 7, 'Y')
    L.put(52, G - 1, 'K').row(56, 6, 'BB*BB')
    L.pit(62, 72, lava=True).put(65, 8, '=').put(70, 5, 'Y')
    L.put(78, G - 1, 'C').put(84, G - 1, 'W')
    L.pit(90, 99, lava=True).put(92, 7, '|').fill(97, 98, 6, 6, 'X')
    L.put(104, G - 1, 'E').put(106, G - 1, 'E').put(108, G - 1, 'E')
    L.pit(114, 124, lava=True).put(117, 8, '=').put(121, 4, 'A')
    L.stairs_up(132, 4).put(144, G - 1, 'W')
    L.put(170, G - 1, 'F')
    return L


def l4_4():
    L = Level(176, "Dev Slime'ın Kalesi", 'stone', 'cave', 400)
    L.ground(0, 175).ceiling(0, 175, 1, 'X').put(3, G - 1, 'S').row(9, 6, 'M?M')
    L.pit(18, 21, lava=True).put(26, G - 1, 'W').put(32, 6, 'A')
    L.pit(38, 46, lava=True).put(40, 8, '=').put(50, G - 1, 'K')
    L.row(54, 6, 'B*B').put(60, G - 1, 'C')
    L.put(66, G - 1, 'E').put(68, G - 1, 'E').pit(74, 77, lava=True)
    # Boss arenası: düz zemin, sağda kapı. Boss lavlara düşerse de yenilmiş sayılır.
    L.fill(84, 84, 1, 6, 'X')                    # arena girişi (alttan geçilir)
    L.put(104, G - 1, 'Z')
    L.fill(124, 124, 1, 9, 'G')
    L.ceiling(125, 175, 1, ' ')
    L.put(140, G - 1, 'F')
    return L


LEVELS = {
    '2-1': l2_1, '2-2': l2_2, '2-3': l2_3, '2-4': l2_4,
    '3-1': l3_1, '3-2': l3_2, '3-3': l3_3, '3-4': l3_4,
    '4-1': l4_1, '4-2': l4_2, '4-3': l4_3, '4-4': l4_4,
}

if __name__ == '__main__':
    failed = []
    for lid, fn in LEVELS.items():
        L = fn()
        problems = L.check()
        if problems:
            failed.append(f'{lid}: ' + '; '.join(problems))
            continue
        L.write(os.path.join(OUT, f'{SLUGS[lid]}.txt'))
    if failed:
        raise SystemExit('\n'.join(failed))
