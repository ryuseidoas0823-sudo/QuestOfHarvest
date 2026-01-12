// ... imports (generateWeapon を追加) ...
import { generateWeapon } from './lib/ItemGenerator';

// ... (既存コード) ...

// GameState初期化部分のみ変更
const gameState = useRef<GameState>({
    map: [],
    chests: [],
    droppedItems: [],
    player: createPlayer(),
    party: [],
    npcs: [],
    enemies: [],
    particles: [],
    camera: { x: 0, y: 0 },
    mode: 'combat',
    settings: settings,
    location: { type: 'world', level: 0, mapsSinceLastTown: 0 },
    activeShop: null
  });

  // 初期化
  useEffect(() => {
    const world = generateWorldMap(0);
    gameState.current.map = world.map;
    gameState.current.chests = world.chests;
    gameState.current.player.x = world.spawnPoint.x;
    gameState.current.player.y = world.spawnPoint.y;
    gameState.current.player.gold = 100;
    
    // ★ 初期装備を与える
    const starterSword = generateWeapon(1, 'common');
    starterSword.name = "Novice Sword";
    // 確実に剣にするための調整（ランダム生成に頼るなら上記で良いが、固定したい場合）
    if (starterSword.weaponStats) {
        starterSword.weaponStats.category = 'Sword';
        // ... 他パラメータ微調整 ...
    }
    gameState.current.player.inventory.push(starterSword);
    // 装備させる
    gameState.current.player.equipment = { mainHand: starterSword };

    // ... (敵生成など既存コード) ...
