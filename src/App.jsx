import { CoinsIcon, LoaderIcon, StoreIcon, Trophy } from "lucide-react"
import { useRef } from "react"
import { useEffect } from "react"
import { useState } from "react"
import { BsBackpack, BsFillGrid3X3GapFill } from "react-icons/bs"
import { FaExchangeAlt } from "react-icons/fa"
import { FaInfo, FaUser } from "react-icons/fa6"
import { GiDynamite, GiMining, GiWarPick } from "react-icons/gi"
import { IoTime } from "react-icons/io5"
import { PiCloverFill, PiSpeedometerFill } from "react-icons/pi"
import { RiNewsFill } from "react-icons/ri"
import isMobile from "is-mobile"
import { IoMdEye } from "react-icons/io"

const stones =
  [
    { name: "Pedra comum", image_url: "http://cdn.rafaeldantas.dev.br/stone.jpeg", raridade: "Comum", coins: 1, seconds: 5, selected: false, enabled: true, probability: 100, rewards: 0 },
    { name: "Pedra escura", image_url: "http://cdn.rafaeldantas.dev.br/blackstone.png", raridade: "Comum", coins: 2, seconds: 15, selected: false, enabled: true, probability: 50, rewards: 0 },
    { name: "Andersite", image_url: "http://cdn.rafaeldantas.dev.br/andersite.png", raridade: "Comum", coins: 2, seconds: 5, selected: false, enabled: true, probability: 30, rewards: 0 },
    { name: "Pedra profunda", image_url: "http://cdn.rafaeldantas.dev.br/deepslate.jpeg", raridade: "Comum", coins: 2, seconds: 30, selected: false, enabled: true, probability: 70, rewards: 0 },
    { name: "Granito", image_url: "http://cdn.rafaeldantas.dev.br/granite.jpeg", raridade: "Comum", coins: 1, seconds: 15, selected: false, enabled: true, probability: 30, rewards: 0 },
    { name: "Ouro", image_url: "http://cdn.rafaeldantas.dev.br/gold.png", raridade: "Raro", coins: 5, seconds: 120, selected: false, enabled: true, probability: 100, rewards: 0 }
  ];

const sprites = Array.from({ length: 21 }, (_, i) => `sprite_${i + 1}.png`);

const images = Array.from({ length: 21 }, (_, i) =>
  `http://cdn.rafaeldantas.dev.br/sprites/sprite_${i + 1}.png`
);

function App() {
  const gold_value = 5;

  const [isLoadingResources, setIsLoadingResources] = useState(true);

  //Sounds
  const som1 = new Audio("https://cdn.rafaeldantas.dev.br/sounds/finish.mp3");
  const mining_sound = useRef(new Audio("https://cdn.rafaeldantas.dev.br/sounds/pickaxe.mp3"));
  const coin_sound = new Audio('https://cdn.rafaeldantas.dev.br/sounds/coin_sound.mp3');
  const game_music = new Audio('https://cdn.rafaeldantas.dev.br/sounds/loading_music.mp3');
  const wow_sound = new Audio('https://cdn.rafaeldantas.dev.br/sounds/wow.mp3');
  const achievement_sound = new Audio('https://cdn.rafaeldantas.dev.br/sounds/achievement.mp3');

  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isChunkLoading, setIsChunkLoading] = useState(false);
  const [isReward, setIsReward] = useState(false);
  const [reward, setReward] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const [datas, setDatas] = useState();
  const [labelRestTime, setLabelRestTime] = useState("0 segundos");

  const [modelBlock, setModelBlocks] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [countRewards, setCountRewards] = useState(0);

  //Users attributes
  const [coins, setCoins] = useState(10);

  //Game attributes
  const [totalRewards, setTotalRewards] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const sprite_image = useRef(null);
  const sprite_frame = useRef(1);
  const character_animation_id = useRef(null);
  const frameDelay = 30; // Tempo entre os frames em milissegundos (100ms = 10 FPS)
  let lastFrameTime = useRef(0) // Armazena o tempo do último frame trocado

  function randomBlock() {
    const index = Math.floor(Math.random() * 6);
    const block = stones[index];
    block.rewards = generateReward(block.probability);
    setTotalPrice(prev => prev + block.coins);
    setTotalRewards(prev => prev + (block.rewards * gold_value));
    return stones[index];
  }

  function handleMining() {
    if (coins >= selectedBlock.coins * multiplier) {
      setTotalPrice(prev => prev - selectedBlock.coins);
      setCoins(prev => prev - (selectedBlock.coins * multiplier));
      mining_sound.current.loop = true; // Som repetindo
      mining_sound.current.play();
      const seconds = selectedBlock.seconds;
      setIsLoading(true);
      const startDate = new Date();
      const targetDate = new Date(startDate.getTime() + (seconds * 1000));
      requestAnimationFrame(animate);

      setDatas({ startDate: startDate, targetDate: targetDate });
    } else {
      alert('Dinheiro insuficiente');
    }
  }

  function checkTime() {
    if (datas && isLoading) {
      const secondsRemaining = Math.round((datas.targetDate - new Date()) / 1000);
      setLabelRestTime(`${converterSegundosEmTexto(secondsRemaining)} segundos restantes`);
      changeProgressBar();

      if (new Date() >= datas.targetDate) {
        mining_sound.current.loop = false; // Stop looping
        mining_sound.current.pause();
        som1.play();
        cancelAnimationFrame(character_animation_id.current);
        sprite_image.current.src = 'http://cdn.rafaeldantas.dev.br/sprites/sprite_1.png';

        //Achievement
        activeNotification();

        // Se houver recompensas
        if (selectedBlock.rewards) {
          setReward(selectedBlock.rewards);
          setIsReward(true);
          setTotalRewards(prev => prev - (selectedBlock.rewards * gold_value));
        }

        setIsLoading(false);
        setDatas({ startDate: new Date(), targetDate: new Date() });
        setSelectedBlock(null);
        setBlocks(prev =>
          prev.map(b =>
            b.id === selectedBlock.id
              ? { ...b, enabled: false }
              : { ...b }
          )
        );
      }
    }
  }

  function activeNotification() {
    setTimeout(() => {
      achievement_sound.play();
      setIsNotificationVisible(true);
      setTimeout(() => setIsNotificationVisible(false), 3000)
    }, 1000);
  }

  function changeProgressBar() {
    const bar = document.getElementById('progressBar');
    const secondsInterval = (datas.targetDate - datas.startDate) / 1000;
    const secondsElapsed = (new Date() - datas.startDate) / 1000;
    let percentualProgress = Math.round((secondsElapsed * 100) / secondsInterval);

    // Garantindo que o percentual não passe de 100% nem fique abaixo de 0%
    percentualProgress = Math.min(Math.max(percentualProgress, 0), 100);

    // Cálculo proporcional da largura
    const larguraTotal = document.getElementById('loading_bar').offsetWidth;
    const larguraAtual = (percentualProgress / 100) * larguraTotal;
    // Corrigindo a atribuição da largura (precisa de "px" para funcionar)
    bar.style.width = `${larguraAtual}px`;
  }

  function handleSelectBlock(block) {
    if (!isLoading && block.enabled && !isReward) {
      setSelectedBlock(block);
      setBlocks(prev =>
        prev.map(b =>
          b.id === block.id
            ? { ...b, selected: true }
            : { ...b, selected: false }
        )
      );
    }
  }

  function handleClaim() {
    coin_sound.play();
    setIsReward(false);
    setCoins(prev => prev + ((gold_value * reward) * multiplier));
    setReward(0);
  }

  function converterSegundosEmTexto(segundos) {
    if (segundos < 0) return "Tempo inválido";

    const unidades = [
      { nome: "dia", plural: "dias", valor: 86400 },
      { nome: "hora", plural: "horas", valor: 3600 },
      { nome: "minuto", plural: "minutos", valor: 60 },
      { nome: "segundo", plural: "segundos", valor: 1 }
    ];

    let resultado = [];

    for (let unidade of unidades) {
      const quantidade = Math.floor(segundos / unidade.valor);
      if (quantidade > 0) {
        resultado.push(`${quantidade} ${quantidade > 1 ? unidade.plural : unidade.nome}`);
        segundos %= unidade.valor;
      }
    }

    return resultado.length > 0 ? resultado.join(", ") : "0 segundos";
  }

  function generateReward(probabilidade) {
    if (probabilidade < 1 || probabilidade > 100) {
      throw new Error("A probabilidade deve ser um número entre 1 e 100.");
    }

    let ocorrencias = 0;
    let chanceAtual = probabilidade;

    // Enquanto a chance for pelo menos 1%, tenta realizar o evento
    while (chanceAtual >= 1) {
      // Gera um número aleatório entre 0 e 100
      if (Math.random() * 100 < chanceAtual) {
        ocorrencias++;
        // A chance para a próxima ocorrência cai pela metade
        chanceAtual /= 2;
      } else {
        // Se a tentativa falhar, interrompe o loop
        break;
      }
    }

    return ocorrencias;
  }

  function handleGenerateChunk() {
    setBlocks(Array.from({ length: 64 }, (_, i) => ({ id: i + 1, ...randomBlock() })));
  }

  function handleClickRandomChunk() {
    setIsChunkLoading(true);
    game_music.play();
    handleGenerateChunk();
    setTimeout(() => {
      setIsChunkLoading(false);
      game_music.pause();
      game_music.currentTime = 0;
      wow_sound.play();
    }, 10000);
  }

  function animate(timestamp) {
    if (timestamp - lastFrameTime.current >= frameDelay) {
      sprite_image.current.src = `http://cdn.rafaeldantas.dev.br/sprites/${sprites[sprite_frame.current]}`;
      sprite_frame.current = (sprite_frame.current + 1) % sprites.length;
      lastFrameTime.current = timestamp; // Atualiza o tempo do último frame
    }
    character_animation_id.current = requestAnimationFrame(animate);
  }


  useEffect(() => {
    handleGenerateChunk();
    setInterval(() => {
      setModelBlocks(Array.from({ length: 64 }, (_, i) => ({ color_index: Math.floor(Math.random() * 3), id: i })));
    }, 300);

    const loadImages = async () => {
      const promises = images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      await Promise.all(promises);
      setIsLoadingResources(false); // Só libera o app depois de carregar todas as imagens
    };

    loadImages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [datas]);

  useEffect(() => {
    if (isMobile) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [selectedBlock, isReward])

  if (isLoadingResources) {
    return <div>Carregando...</div>
  }

  return (
    <>
      <div className='text-white min-h-[100vh] bg-zinc-700 flex flex-col items-center lg:gap-4 relative w-screen overflow-hidden'>
        <div className="lg:px-4 lg:pb-0 pb-8">
          <div className="flex justify-between w-full bg-zinc-800 py-2 px-8">
            <div className="flex gap-2">
              <div className="flex bg-zinc-700 justify-center items-center p-2 hover:bg-zinc-600 duration-300"><FaUser size={30} color="white" /></div>
              <div className="flex justify-center items-center p-2 hover:bg-zinc-600 duration-300"><BsBackpack size={30} color="white" /></div>
              <div className="flex justify-center items-center p-2 hover:bg-zinc-600 duration-300"><StoreIcon size={30} color="white" /></div>
              <div className="flex justify-center items-center p-2 hover:bg-zinc-600 duration-300"><RiNewsFill size={30} color="white" /></div>
              <div className="flex justify-center items-center p-2 hover:bg-zinc-600 duration-300"><Trophy size={30} color="white" /></div>
            </div>
            {/* moedas */}
            <div className="flex items-center gap-2">
              <img className="w-[30px]" src="http://cdn.rafaeldantas.dev.br/coin.png" />
              <p className="font-extrabold text-white text-sm">{coins}</p>
            </div>
          </div>
          <div className="flex lg:flex-row flex-col justify-center lg:gap-16 gap-8 mt-4">
            <div className="flex flex-col items-center gap-4">
              <img ref={sprite_image} src='http://cdn.rafaeldantas.dev.br/sprites/sprite_1.png' className={`-scale-x-100 w-[280px] ${!isLoading ? 'hidden' : null} lg:block my-2`} />
              {/* Skills */}
              <div className={`flex flex-col gap-2 ${isLoading ? 'hidden lg:flex' : null}`}>
                <div>
                  <p className="font-bold py-1 text-sm">Multiplicador:</p>
                  <ul className="flex gap-1 text-zinc-900">
                    <li onClick={() => setMultiplier(1)} className={`p-2 border-2 hover:bg-zinc-600 hover:text-white font-semibold text-[12px] ${multiplier === 1 ? "bg-zinc-800 border-zinc-950 text-white" : "bg-zinc-300 border-zinc-400"}`}>1x</li>
                    <li onClick={() => setMultiplier(2)} className={`p-2 border-2 hover:bg-zinc-600 hover:text-white font-semibold text-[12px] ${multiplier === 2 ? "bg-zinc-800 border-zinc-950 text-white" : "bg-zinc-300 border-zinc-400"}`}>2x</li>
                    <li onClick={() => setMultiplier(5)} className={`p-2 border-2 hover:bg-zinc-600 hover:text-white font-semibold text-[12px] ${multiplier === 5 ? "bg-zinc-800 border-zinc-950 text-white" : "bg-zinc-300 border-zinc-400"}`}>5x</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold py-1 text-sm">Habilidades:</p>
                  <ul className="flex gap-1">
                    <li className="p-2 bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group"><GiMining size={20} className="group-hover:text-white text-zinc-700" /></li>
                    <li className="p-2 bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group"><PiSpeedometerFill size={20} className="group-hover:text-white text-zinc-700" /></li>
                    <li className="p-2 bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group"><PiCloverFill size={20} className="group-hover:text-white text-zinc-700" /></li>
                    <li className="p-2 bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group"><IoMdEye size={20} className="group-hover:text-white text-zinc-700" /></li>
                    <li className="p-2 bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group"><GiDynamite size={20} className="group-hover:text-white text-zinc-700" /></li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold py-1 text-sm">Picareta:</p>
                  <ul className="flex gap-1">
                    <li className="bg-zinc-400 border-4 border-zinc-500 hover:bg-green-900 duration-300 group"><img src="https://cdn.rafaeldantas.dev.br/pickaxe_2.png" className="w-[30px] p-1" /></li>
                    <li className="bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group"><img src="https://cdn.rafaeldantas.dev.br/netherite-pickaxe.png" className="w-[30px] p-1" /></li>
                    <li className="bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group"><img src="https://cdn.rafaeldantas.dev.br/pickaxe_1.png" className="w-[30px] p-1" /></li>
                    <li className="bg-green-600 border-4 border-green-800 hover:bg-green-900 duration-300 group flex justify-center items-center w-[35px]"><FaExchangeAlt color="white" /></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* blocos */}
            <div className={`${isLoading ? 'hidden lg:block' : null} lg:block flex flex-col items-center`}>
              <ul className={`grid grid-cols-8 lg:w-auto w-[90vw] gap-1 p-2 bg-zinc-300 border-4 border-zinc-500 ${isChunkLoading ? 'hidden' : null}`}>
                {blocks.map(block => {
                  return <li key={block.id + '-bloco'} className={`lg:h-[45px] lg:w-[45px] w-auto bg-green-700 hover:scale-110 duration-300 border-4 border-zinc-700 hover:border-green-600 overflow-hidden ${!block.enabled ? 'bg-zinc-300 border-none' : null} ${isLoading && block.selected ? 'animate-pulse' : null}`} onClick={() => handleSelectBlock(block)}>
                    <img className={`lg:w-[45px] w-full ${block.selected || !block.enabled ? 'opacity-0' : null}`} src={`${block.image_url}`}></img>
                  </li>
                })}
              </ul>
              <ul className={`grid grid-cols-8 lg:w-auto w-[90vw] gap-1 p-2 bg-zinc-300 border-4 border-zinc-500 ${!isChunkLoading ? 'hidden' : null}`}>
                {modelBlock.map(block => {
                  return <li key={block.id + '-model'} className={`lg:h-[45px] lg:w-[45px] w-full aspect-square border-4 border-zinc-700 overflow-hidden ${block.color_index === 1 ? 'bg-green-700' : block.color_index === 2 ? 'bg-green-600' : 'bg-green-500'}`}>
                  </li>
                })}
              </ul>
              <div className="p-2 bg-zinc-800 w-[250px] flex items-center gap-2 mt-1">
                <BsFillGrid3X3GapFill onClick={handleClickRandomChunk} size={40} className="p-2 bg-green-700 hover:bg-green-800 duration-300 text-white" />
                <div>
                  <p className="text-sm">Recompensa total: <span className="font-bold">{totalRewards}</span></p>
                  <p className="text-sm">Preço total: <span className="font-bold">{totalPrice}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Barra de execução */}
        {
          isLoading ?
            <div className="mt-2">
              <p className="font-bold text-zinc-300">Minerando bloco de {selectedBlock.name}</p>
              <div className="flex gap-2 items-center">
                <ul className="flex flex-col gap-2 mt-1">
                  <li id="loading_bar" className="lg:w-[600px] w-[90vw] box-content bg-zinc-100 border-4 border-green-800 animate-pulse">
                    <div id="progressBar" className={`bg-green-500 h-[40px] relative`}>
                    </div>
                  </li>
                  <li className="flex items-center gap-2">
                    <LoaderIcon className="animate-spin" size={20} color="green" />
                    <p>{labelRestTime}</p>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center mt-2">
                <p className="py-1 px-4 bg-zinc-800 text-sm text-white font-bold">Cancelar</p>
              </div>
            </div> :
            null
        }

        {/* Barra de informação */}
        {
          selectedBlock && !isLoading ?
            <div className="relative lg:w-[750px] w-[90vw] lg:p-6 p-4 bg-zinc-300 drop-shadow-md border-zinc-700 flex flex-col lg:flex-row gap-4 mt-2 text-zinc-900 lg:my-0 my-8">
              <img src={selectedBlock.image_url} className="border-8 border-zinc-700 w-[120px] h-[120px]" />
              <div className="flex-1">
                <p className="font-bold text-2xl text-zinc-800">{selectedBlock.id} - {selectedBlock.name}</p>
                <p className="text-sm">Raridade: {selectedBlock.raridade}</p>
                <div className="flex items-center gap-1 my-1">
                  <IoTime />
                  <p className="font-semibold">{converterSegundosEmTexto(selectedBlock.seconds)}</p>
                </div>
                <div className="flex items-center gap-1 my-1">
                  <img src="https://cdn.rafaeldantas.dev.br/coin.png" className="w-[15px]" />
                  <p className="font-semibold">{selectedBlock.coins * multiplier}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-2 items-center p-1 bg-zinc-600 border-2 border-zinc-800 hover:bg-zinc-700 hover:border-zinc-900 duration-300">
                <FaInfo size={15} color="white" />
              </div>
              <div onClick={handleMining} className="lg:absolute lg:bottom-2 lg:right-2 flex gap-2 items-center px-4 py-2 bg-green-600 border-6 border-green-800 hover:bg-green-700 hover:border-green-900 duration-300">
                <p className="font-bold text-white">Minerar</p>
                <GiWarPick size={25} color="white" />
              </div>
            </div>
            : null
        }
        {/* Barra de ganhos */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-zinc-300 border-8 border-zinc-700 flex justify-center items-center hidden">
          <img className="p-8 bg-zinc-800 h-[200px] w-auto" src="https://cdn.rafaeldantas.dev.br/gold_ingot.png" />
        </div>

        {/* Recompensa */}
        {
          isReward ?
            <div className="relative lg:w-[750px] w-[90vw] p-4 bg-zinc-300 drop-shadow-md text-zinc-900 mb-8">
              <p className="text-2xl font-bold text-zinc-800">Recompensa:</p>
              <ul className="flex gap-2 mt-2">
                <li className="lg:block flex gap-2">
                  <div className="h-[100px] w-[100px] flex justify-center items-center bg-gradient-to-b from-zinc-100 to-amber-300 border-2 border-zinc-700 relative hover:scale-105 duration-300">
                    <div className="p-2 bg-zinc-700 flex justify-center items-center w-[20px] h-[20px] text-sm font-bold text-white absolute top-0 left-0">{reward}</div>
                    <img className="w-[50px]" src="https://cdn.rafaeldantas.dev.br/gold-ingot.png" />
                  </div>
                  <div>
                    <p className="text-sm lg:text-center font-semibold">Ouro</p>
                    <div className="flex lg:items-center lg:justify-center gap-1 mt-1">
                      <img className="w-[20px]" src="https://cdn.rafaeldantas.dev.br/coin.png" />
                      <p className="text-sm text-end font-bold">{(reward * gold_value) * multiplier}</p>
                    </div>
                  </div>
                </li>
                {/*
                <li>
                  <div className="h-[100px] w-[100px] flex justify-center items-center bg-gradient-to-b from-zinc-100 to-purple-500 border-2 border-zinc-700 relative hover:scale-105 duration-300">
                    <div className="p-2 bg-zinc-700 flex justify-center items-center w-[20px] h-[20px] text-sm font-bold text-white absolute top-0 left-0">3</div>
                    <img className="w-[50px]" src="./src/assets/amethyst.png" />
                  </div>
                  <p className="text-sm text-center font-semibold">Ametista</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <img className="w-[20px]" src="./src/assets/coin.png" />
                    <p className="text-sm text-end font-bold">30</p>
                  </div>
                </li>
                */}
              </ul>
              <div onClick={handleClaim} className="lg:absolute lg:bottom-2 right-2 flex gap-2 items-center px-4 py-2 bg-green-600 border-6 border-green-800 hover:bg-green-700 hover:border-green-900 duration-300 mt-2">
                <p className="font-bold text-white">Obter recompensa</p>
                <CoinsIcon size={25} color="white" />
              </div>
            </div>
            : null
        }
        <div className="absolute hidden lg:flex top-8 left-8 w-[250px] h-[92vh] bg-zinc-800 items-center justify-center">
          <p className="text-white text-4xl transform rotate-270 font-bold">Google Ads</p>
        </div>
        <div className="absolute hidden lg:flex top-8 right-8 w-[250px] h-[92vh] bg-zinc-800 items-center justify-center">
          <p className="text-white text-4xl transform rotate-270 font-bold">Google Ads</p>
        </div>
        <div
          className={`lg:absolute fixed lg:top-4 lg:right-4 lg:w-[600px] lg:h-full w-full h-screen top-0 left-0 p-8 border-8 border-zinc-950 bg-zinc-900 flex lg:flex-row lg:justify-normal items-center flex-col justify-center  gap-4 duration-1000 transition-transform ${isNotificationVisible ? 'translate-x-0' : 'translate-x-[620px]'
            }`}
        >
          <img className="w-[80px]" src="https://cdn.rafaeldantas.dev.br/stone.jpeg"></img>
          <div className="h-[80px]">
            <p className="font-bold text-[20px] text-green-400">Conquista Desbloqueada!</p>
            <p className="font-bold text-[24px] text-white">Minerou o seu primeiro bloco!</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
