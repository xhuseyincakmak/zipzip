"""Usta Yolu: 4 ek bölüm. Çalıştır: python3 tools/worlds5.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from levelkit import Level, GROUND

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'levels')
G = GROUND


def kum_firtinasi():
    L = Level(176, 'Kum Fırtınası', 'sand', 'desert', 300)
    L.ground(0, 175).put(3, G - 1, 'S').row(9, 6, '?M?')
    L.ground(16, 22, 8).ground(19, 22, 6).coins(19, 22, 4).put(17, 7, 'E')   # kum tepesi
    L.pit(28, 31).coins(28, 31, 7)
    L.put(36, G - 1, 'W').put(42, 6, 'A')
    L.ground(46, 54, 7).put(50, 6, 'E').coins(47, 53, 5)
    L.pit(58, 63).put(59, 8, '=')
    L.put(68, G - 1, 'C').row(72, 6, 'BB*BBB?').coins(73, 77, 4)
    L.row(82, G - 1, '^^^').put(88, 5, 'Y')
    L.pit(92, 96).put(93, 6, '|')
    L.put(102, G - 1, 'K').put(104, G - 1, 'E').put(106, G - 1, 'E')
    L.put(112, G - 1, 'W')
    L.ground(118, 126, 7).put(122, 4, 'A')
    L.pit(130, 133).coins(130, 133, 6)
    L.stairs_up(138, 5)
    L.put(160, G - 1, 'F')
    return L


def buz_magarasi():
    L = Level(178, 'Buz Mağarası', 'snow', 'cave', 300)
    L.ground(0, 177).ceiling(0, 158).put(3, G - 1, 'S').row(8, 6, 'M??')
    L.ceiling(18, 32, 4).coins(19, 31, 8).put(24, G - 1, 'E').put(28, G - 1, 'E')   # alçak tavan
    L.row(36, G - 1, '^^^^').put(35, 7, '=')
    L.put(46, G - 1, 'W').put(52, 5, 'Y')
    L.pit(56, 59).coins(56, 59, 7)
    L.put(64, G - 1, 'C')
    L.fill(70, 71, 6, 9).fill(76, 77, 7, 9).coins(70, 71, 4)
    L.put(82, G - 1, 'K').row(86, 6, 'B*B?B')
    L.pit(94, 99).put(95, 6, '|')
    L.put(104, 6, 'A').put(108, G - 1, 'E').put(110, G - 1, 'E')
    L.row(116, G - 1, '^^^^^').put(116, 7, '=').coins(116, 120, 5)
    L.stairs_up(130, 4)
    L.put(168, G - 1, 'F')
    return L


def mor_orman():
    L = Level(176, 'Mor Orman', 'purple', 'mushrooms', 300)
    L.ground(0, 14).put(3, G - 1, 'S').put(9, 6, 'M')
    L.pit(15, 175)
    L.fill(18, 21, 8, 8).coins(18, 21, 6)
    L.put(25, 6, '|')
    L.fill(31, 35, 6, 6).put(33, 5, 'E')
    L.put(39, 7, '=')
    L.fill(48, 50, 6, 6).put(49, 2, '?')
    L.put(54, 6, '|')
    L.ground(60, 72).put(63, G - 1, 'C').row(64, 6, 'B*B').put(68, G - 1, 'K')
    L.put(76, 8, '=')
    L.fill(85, 88, 6, 6).put(86, 3, 'A')
    L.put(92, 5, '|')
    L.fill(98, 101, 7, 7).put(100, 4, 'Y')
    L.put(105, 8, '=')
    L.fill(114, 117, 6, 6).coins(114, 117, 4)
    L.put(121, 6, '|')
    L.ground(127, 175).put(132, G - 1, 'E').put(134, G - 1, 'E').stairs_up(140, 4)
    L.put(158, G - 1, 'F')
    return L


def ates_ormani():
    L = Level(178, 'Ateş Ormanı', 'dirt', 'trees', 330)
    L.ground(0, 177).put(3, G - 1, 'S').row(9, 6, '?M?')
    L.pit(16, 21, lava=True).put(17, 8, '=').coins(16, 21, 6)
    L.put(26, G - 1, 'E').put(28, G - 1, 'E').put(34, G - 1, 'W')
    L.pit(40, 47, lava=True).put(42, 6, '|')
    L.row(52, 6, 'BB*BB').put(56, G - 1, 'K')
    L.put(62, G - 1, 'C')
    L.pit(68, 75, lava=True).put(69, 7, '=').put(72, 4, 'Y')
    L.fill(80, 81, 7, 9, 'X').put(86, 6, 'A')
    L.pit(92, 103, lava=True).put(93, 8, '=').put(99, 6, '=')
    L.put(108, G - 1, 'E').put(110, G - 1, 'E').put(112, G - 1, 'E').put(118, G - 1, 'W')
    L.pit(124, 129, lava=True).put(125, 6, '|')
    L.stairs_up(136, 6)
    L.put(162, G - 1, 'F')
    return L


LEVELS = {
    'kum-firtinasi': kum_firtinasi,
    'buz-magarasi': buz_magarasi,
    'mor-orman': mor_orman,
    'ates-ormani': ates_ormani,
}

if __name__ == '__main__':
    failed = []
    for slug, fn in LEVELS.items():
        L = fn()
        problems = L.check()
        if problems:
            failed.append(f'{slug}: ' + '; '.join(problems))
            continue
        L.write(os.path.join(OUT, f'{slug}.txt'))
    if failed:
        raise SystemExit('\n'.join(failed))
