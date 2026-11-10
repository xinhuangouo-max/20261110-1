let idleSprite; // 儲存角色待機精靈圖
let walkSprite; // 儲存角色行走精靈圖
let magicFrames = []; // 儲存第 5 組的施法動畫影格
let effectFrames = []; // 儲存第 5 組的魔法特效影格
let magicLoaded = false; // 記錄施法精靈圖是否已成功載入
let effectLoaded = false; // 記錄特效精靈圖是否已成功載入
let magicLoadedCount = 0; // 計算成功載入的施法影格數
let effectLoadedCount = 0; // 計算成功載入的特效影格數
let spaceHeld = false; // 記錄空白鍵是否仍被按住
let characterX; // 儲存角色中心點的水平位置
let facing = 1; // 記錄角色方向，1 為右、-1 為左
let walkFrame = 0; // 記錄目前行走動畫格數
let magicFrame = 0; // 記錄目前施法動畫格數
let animationTick = 0; // 控制精靈動畫播放速度
let isCasting = false; // 記錄角色是否正在播放施法動畫
let castDirection = 1; // 記錄施法開始時角色面向的方向
let effectActive = false; // 記錄魔法特效是否正在移動
let effectX = 0; // 記錄魔法特效的水平位置
let effectY = 0; // 記錄魔法特效的垂直位置
let effectDirection = 1; // 記錄魔法特效的移動方向
let effectFrame = 0; // 記錄目前特效動畫格數
let effectTick = 0; // 控制特效動畫播放速度
const idleFrameCount = 12; // 設定第 1 組待機精靈圖的 12 格數
const walkFrameCount = 17; // 設定第 3 組行走精靈圖的 17 格數
const magicFrameCount = 6; // 設定第 5 組施法動畫的 6 張影格
const effectFrameCount = 5; // 設定魔法特效精靈圖的 5 格數

function preload() { // 在畫布啟動前載入角色圖片
  idleSprite = loadImage("1/stop/stop.png"); // 載入 12 格待機精靈圖（1447 × 212）
  walkSprite = loadImage("3/walk/walk.png"); // 載入 17 格行走精靈圖（2497 × 190）
  for (let frame = 0; frame < magicFrameCount; frame += 1) { // 逐張載入第 5 組的施法影格
    magicFrames[frame] = loadImage(`5/tershiow/${frame}.png`, () => { // 載入施法影格並監聽完成狀態
      magicLoadedCount += 1; // 累加已載入的施法影格數
      magicLoaded = magicLoadedCount === magicFrameCount; // 所有施法影格載入後啟用施法
    }, () => console.warn(`找不到施法影格：5/tershiow/${frame}.png`)); // 顯示施法影格載入失敗訊息
  } // 結束施法影格載入
  for (let frame = 0; frame < effectFrameCount; frame += 1) { // 逐張載入第 5 組的特效影格
    const fileNumber = frame + 6; // 對應特效影格檔名 6.png 至 10.png
    effectFrames[frame] = loadImage(`5/tershiow/${fileNumber}.png`, () => { // 載入特效影格並監聽完成狀態
      effectLoadedCount += 1; // 累加已載入的特效影格數
      effectLoaded = effectLoadedCount === effectFrameCount; // 所有特效影格載入後啟用特效
    }, () => console.warn(`找不到特效影格：5/tershiow/${fileNumber}.png`)); // 顯示特效影格載入失敗訊息
  } // 結束特效影格載入
} // 結束圖片載入函式

function setup() { // 設定全螢幕畫布與角色初始位置
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  characterX = width * 2 / 3; // 將角色初始位置設為畫布寬度的三分之二
} // 結束畫布設定函式

function draw() { // 每個畫格更新並繪製場景
  background(135, 206, 235); // 使用天空藍作為背景
  const idleHeight = min(height * 0.62, width * 0.24 * idleSprite.height / (idleSprite.width / idleFrameCount)); // 依畫布尺寸計算適合的角色高度
  const idleWidth = idleHeight * (idleSprite.width / idleFrameCount) / idleSprite.height; // 依待機單格比例計算角色寬度
  const walkHeight = min(height * 0.62, width * 0.24 * walkSprite.height / (walkSprite.width / walkFrameCount)); // 依畫布尺寸計算行走角色高度
  const walkWidth = walkHeight * (walkSprite.width / walkFrameCount) / walkSprite.height; // 依行走單格比例計算角色寬度
  const currentMagicImage = isCasting ? magicFrames[magicFrame] : null; // 取得目前要顯示的施法影格
  const magicHeight = currentMagicImage ? min(height * 0.62, width * 0.24 * currentMagicImage.height / currentMagicImage.width) : idleHeight; // 依目前施法影格比例計算顯示高度
  const magicWidth = currentMagicImage ? magicHeight * currentMagicImage.width / currentMagicImage.height : idleWidth; // 依目前施法影格比例計算顯示寬度
  const movingLeft = keyIsDown(LEFT_ARROW); // 判斷目前是否按住左方向鍵
  const movingRight = keyIsDown(RIGHT_ARROW); // 判斷目前是否按住右方向鍵
  const hasDirectionInput = movingLeft !== movingRight; // 判斷是否只按住其中一個方向鍵
  const requestedDirection = movingLeft ? -1 : 1; // 取得目前要求移動的方向
  const moveSpeed = max(2, min(8, width * 0.006)); // 依畫布寬度調整角色移動速度
  const proposedX = constrain(characterX + requestedDirection * moveSpeed, walkWidth / 2, width - walkWidth / 2); // 計算角色行走一格後可到達的位置
  const isWalking = !isCasting && hasDirectionInput && proposedX !== characterX; // 施法時停止移動，其他時候只有移動才播放行走動畫
  const sprite = isCasting ? currentMagicImage : isWalking ? walkSprite : idleSprite; // 依角色狀態選擇施法、行走或待機圖
  const frameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : idleFrameCount; // 取得目前精靈圖的格數
  const frameWidth = sprite.width / (isCasting ? 1 : frameCount); // 計算目前精靈圖每格的實際寬度
  const displayWidth = isCasting ? magicWidth : isWalking ? walkWidth : idleWidth; // 取得目前角色顯示寬度
  const displayHeight = isCasting ? magicHeight : isWalking ? walkHeight : idleHeight; // 取得目前角色顯示高度

  if (isWalking) { // 按下左右鍵時更新方向與位置
    facing = requestedDirection; // 設定角色朝目前移動方向面向
    characterX = proposedX; // 將角色移至計算好的新位置
    characterX = constrain(characterX, displayWidth / 2, width - displayWidth / 2); // 限制角色不超出畫布左右邊界
  } // 結束行走狀態的位置更新

  animationTick += 1; // 累加動畫計時器
  if ((isCasting || isWalking) && animationTick >= 6) { // 施法或行走時每六個畫格切換一次精靈圖
    animationTick = 0; // 重設動畫計時器
    if (isCasting) { // 施法時播放一次施法動畫
      magicFrame += 1; // 切換到下一個施法動畫格
      if (magicFrame >= magicFrameCount) { // 所有施法動畫格播放完成時結束施法
        isCasting = false; // 結束施法狀態
        magicFrame = 0; // 將施法動畫格重設為第一格
        launchMagicEffect(); // 依施法時的面向發射魔法特效
      } // 結束施法動畫判斷
    } else { // 行走時循環播放行走動畫
      walkFrame = (walkFrame + 1) % walkFrameCount; // 切換到下一個行走動畫格
    } // 結束施法與行走動畫判斷
  } // 結束動畫速度控制

  const currentFrame = isCasting ? 0 : isWalking ? walkFrame : 0; // 施法影格獨立載入，停止時顯示待機圖第一格
  push(); // 儲存目前畫布座標狀態
  if (facing < 0) { // 角色面向左方時水平翻轉畫布
    translate(characterX, 0); // 將座標原點移至角色中心
    scale(-1, 1); // 以水平鏡射方式翻轉角色
    image(sprite, -displayWidth / 2, height - displayHeight, displayWidth, displayHeight, currentFrame * frameWidth, 0, frameWidth, sprite.height); // 繪製翻轉後且底部貼齊畫布的角色
  } else { // 角色面向右方時維持原方向
    image(sprite, characterX - displayWidth / 2, height - displayHeight, displayWidth, displayHeight, currentFrame * frameWidth, 0, frameWidth, sprite.height); // 繪製角色並裁切目前動畫格
  } // 結束角色方向繪製
  pop(); // 還原畫布座標狀態
  updateAndDrawMagicEffect(); // 更新並繪製飛行中的魔法特效
} // 結束畫格繪製函式

function keyPressed() { // 處理鍵盤按鍵事件
  if (keyCode === 32) { // 偵測空白鍵按下事件
    if (!spaceHeld && !isCasting && magicLoaded) { // 僅在首次按下且施法圖已載入時啟動動畫
      isCasting = true; // 開始施法動畫
      magicFrame = 0; // 從施法動畫第一格開始播放
      animationTick = 0; // 重設施法動畫計時器
      castDirection = facing; // 記住施法開始時角色面向
    } // 結束施法啟動判斷
    spaceHeld = true; // 記錄空白鍵持續按住以避免連續施法
    return false; // 阻止空白鍵捲動網頁
  } // 結束空白鍵處理
} // 結束鍵盤按鍵事件

function keyReleased() { // 處理鍵盤放開事件
  if (keyCode === 32) { // 放開空白鍵時
    spaceHeld = false; // 允許下次按下空白鍵重新施法
  } // 結束空白鍵放開判斷
} // 結束鍵盤放開事件

function launchMagicEffect() { // 在施法動畫結束時建立魔法特效
  if (!effectLoaded) { // 特效素材尚未載入時不建立特效
    return; // 結束特效建立函式
  } // 結束特效素材檢查
  const castImage = magicFrames[0]; // 取得施法動畫第一張影格
  const characterHeight = min(height * 0.62, width * 0.24 * castImage.height / castImage.width); // 依畫布尺寸取得施法角色高度
  const characterWidth = characterHeight * castImage.width / castImage.height; // 依施法影格比例取得角色寬度
  effectDirection = castDirection; // 設定特效沿施法時的面向移動
  effectX = characterX + effectDirection * characterWidth * 0.4; // 從角色前方發射特效
  effectY = height - characterHeight * 0.56; // 將特效放在角色身體附近
  effectFrame = 0; // 從特效動畫第一格開始播放
  effectTick = 0; // 重設特效動畫計時器
  effectActive = true; // 啟動特效移動
} // 結束魔法特效建立函式

function updateAndDrawMagicEffect() { // 更新特效位置並繪製特效動畫
  if (!effectActive || !effectLoaded) { // 沒有活動特效或素材尚未載入時不繪製
    return; // 結束特效更新函式
  } // 結束特效狀態檢查
  const currentEffectImage = effectFrames[effectFrame]; // 取得目前要顯示的特效影格
  const effectHeight = max(12, height * 0.035); // 依畫布高度設定特效顯示高度
  const effectWidth = effectHeight * currentEffectImage.width / currentEffectImage.height; // 依特效影格比例計算顯示寬度
  effectX += effectDirection * max(6, min(18, width * 0.012)); // 讓特效朝角色面向移動
  if (effectX <= 0 || effectX >= width) { // 特效抵達畫布左右邊界時
    effectActive = false; // 隱藏並停止特效
    return; // 結束本次特效繪製
  } // 結束特效邊界判斷
  effectTick += 1; // 累加特效動畫計時器
  if (effectTick >= 4) { // 每四個畫格切換一次特效動畫
    effectTick = 0; // 重設特效動畫計時器
    effectFrame = (effectFrame + 1) % effectFrameCount; // 循環切換五格特效動畫
  } // 結束特效動畫速度控制
  push(); // 儲存目前畫布座標狀態
  translate(effectX, effectY); // 將座標原點移至特效中心
  scale(effectDirection, 1); // 讓特效方向符合移動方向
  image(currentEffectImage, -effectWidth / 2, -effectHeight / 2, effectWidth, effectHeight); // 繪製目前特效動畫格
  pop(); // 還原畫布座標狀態
} // 結束魔法特效更新函式

function windowResized() { // 視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); // 讓畫布持續填滿整個視窗
  characterX = constrain(characterX, 0, width); // 保持角色位置在新畫布範圍內
} // 結束視窗尺寸調整函式
