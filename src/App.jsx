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


const sprites = Array.from({ length: 21 }, (_, i) => `sprite_${i + 1}.png`);

const images = Array.from({ length: 21 }, (_, i) =>
  `https://cdn.rafaeldantas.dev.br/sprites/sprite_${i + 1}.png`
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
  const [reward, setReward] = useState([]);
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
    setTotalPrice(prev => prev + block.custo);
    setTotalRewards(prev => prev + (block.rewards * gold_value));
    return stones[index];
  }

  async function handleMining() {
    if (coins >= selectedBlock.custo * multiplier) {

      //API
      const response = await fetch('https://api-garimpim.vercel.app/minerar/' + selectedBlock.posicao);
      const json = await response.json();

      const seconds = selectedBlock.segundos;
      const startDate = new Date();
      const targetDate = new Date(startDate.getTime() + (seconds * 1000));
      setDatas({ startDate: startDate, targetDate: targetDate });

      ativarMineracao();

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
        finalizarMineracao();
      }
    }
  }

  function ativarMineracao() {
    //setTotalPrice(prev => prev - selectedBlock.custo);
    //setCoins(prev => prev - (selectedBlock.custo * multiplier));
    mining_sound.current.loop = true; // Som repetindo
    mining_sound.current.play();
    setIsLoading(true);
    requestAnimationFrame(animate);
  }

  function finalizarMineracao() {
    mining_sound.current.loop = false; // Stop looping
    mining_sound.current.pause();
    som1.play();
    cancelAnimationFrame(character_animation_id.current);
    sprite_image.current.src = 'https://cdn.rafaeldantas.dev.br/sprites/sprite_1.png';

    setIsLoading(false);
    setDatas({ startDate: new Date(), targetDate: new Date() });
    setSelectedBlock(null);
    setBlocks(prev =>
      prev.map(b =>
        b.posicao === selectedBlock.posicao
          ? { ...b, enabled: false }
          : { ...b }
      )
    );

    // Se houver recompensas
    checarStatus();
  }

  function activeNotification() {
    setTimeout(() => {
      achievement_sound.play();
      setIsNotificationVisible(true);
      setTimeout(() => setIsNotificationVisible(false), 5000)
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
    if (!isLoading && block.enabled && !reward.length) {
      setSelectedBlock(block);
      setBlocks(prev =>
        prev.map(b =>
          b.posicao === block.posicao
            ? { ...b, selected: true }
            : { ...b, selected: false }
        )
      );
    }
  }

  async function handleClaim() {
    const response = await fetch('https://api-garimpim.vercel.app/reivindicar');
    const data = await response.json();
    coin_sound.play();
    setReward([]);
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

  async function carregarChunk() {
    const response = await fetch('https://api-garimpim.vercel.app/get_chunk');
    const chunk = await response.json();
    setBlocks(chunk.map(bloco => { return { ...bloco, selected: false } }));
  }

  async function gerarChunk() {
    const response = await fetch('https://api-garimpim.vercel.app/gerar_chunk');
    const chunk = await response.json();
    setBlocks(chunk.map(bloco => { return { ...bloco, selected: false } }));
  }

  async function handleClickRandomChunk() {
    setIsChunkLoading(true);
    game_music.play();
    await gerarChunk();
    setTimeout(() => {
      setIsChunkLoading(false);
      game_music.pause();
      game_music.currentTime = 0;
      wow_sound.play();
    }, 3000);
  }

  function animate(timestamp) {
    if (timestamp - lastFrameTime.current >= frameDelay) {
      sprite_image.current.src = `https://cdn.rafaeldantas.dev.br/sprites/${sprites[sprite_frame.current]}`;
      sprite_frame.current = (sprite_frame.current + 1) % sprites.length;
      lastFrameTime.current = timestamp; // Atualiza o tempo do último frame
    }
    character_animation_id.current = requestAnimationFrame(animate);
  }

  async function checarStatus() {
    const response = await fetch('https://api-garimpim.vercel.app/checar_status');
    const data = await response.json();

    switch (data.status) {
      case 'minerando':
        setDatas({ startDate: new Date(data.data_inicio), targetDate: new Date(data.data_objetivo) });
        setSelectedBlock(data.bloco);
        ativarMineracao();
        break;
      case 'recompensa':
        setReward(data.drops);
        data.drops.map(item => console.log(item.nome));
        console.log(data.drops)
        break;
    }
  }


  useEffect(() => {
    carregarChunk();
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
      //setIsLoadingResources(false); // Só libera o app depois de carregar todas as imagens
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
  }, [selectedBlock, reward])

  if (isLoadingResources) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-slate-700">
        <div onClick={() => {
          setIsLoadingResources(false);
          checarStatus();
        }} className="py-8 px-16 bg-slate-900 hover:bg-slate-950 text-lg text-white font-bold">Iniciar</div>
      </div>
    );
  }

  return (
    <>
      <div className='text-black min-h-[100vh] bg-zinc-300 flex flex-col items-center lg:gap-4 relative w-screen overflow-hidden'>
        <div className="lg:px-4 lg:pb-0 pb-8">
          {/* Menu */}
          <div className="flex justify-between w-full bg-zinc-800 py-4 px-8 fixed top-0 left-0">
            <div className="flex gap-2">
              <div className="flex bg-zinc-700 justify-center items-center p-2 hover:bg-zinc-600 duration-300"><FaUser size={30} color="white" /></div>
              <div className="flex justify-center items-center p-2 hover:bg-zinc-600 duration-300"><BsBackpack size={30} color="white" /></div>
              <div className="flex justify-center items-center p-2 hover:bg-zinc-600 duration-300"><StoreIcon size={30} color="white" /></div>
              <div className="flex justify-center items-center p-2 hover:bg-zinc-600 duration-300"><RiNewsFill size={30} color="white" /></div>
              <div className="flex justify-center items-center p-2 hover:bg-zinc-600 duration-300"><Trophy size={30} color="white" /></div>
            </div>
            {/* moedas */}
            <div className="flex items-center gap-2">
              <img className="w-[30px]" src="https://cdn.rafaeldantas.dev.br/coin.png" />
              <p className="font-extrabold text-white text-sm">{coins}</p>
            </div>
          </div>
          <div className="flex lg:flex-row flex-col justify-center lg:gap-16 gap-8 mt-[120px]">
            <div className="flex flex-col items-center gap-4">
              <img ref={sprite_image} src='https://cdn.rafaeldantas.dev.br/sprites/sprite_1.png' className={`-scale-x-100 w-[280px] ${!isLoading ? 'hidden' : null} lg:block my-2`} />
              {/* Skills */}
              <div className={`flex flex-col gap-2 ${isLoading ? 'hidden lg:flex' : null}`}>
                <div>
                  <p className="font-bold py-1 text-sm">Multiplicador:</p>
                  <ul className="flex gap-1 text-zinc-900">
                    <li onClick={() => setMultiplier(1)} className={`h-11 w-11 flex justify-center items-center border-2 hover:bg-zinc-600 hover:text-white font-semibold text-[12px] ${multiplier === 1 ? "bg-zinc-800 border-zinc-950 text-white" : "bg-zinc-200 border-zinc-400"} rounded-md`}>1x</li>
                    <li onClick={() => setMultiplier(2)} className={`h-11 w-11 flex justify-center items-center border-2 hover:bg-zinc-600 hover:text-white font-semibold text-[12px] ${multiplier === 2 ? "bg-zinc-800 border-zinc-950 text-white" : "bg-zinc-200 border-zinc-400 rounded-md"}`}>2x</li>
                    <li onClick={() => setMultiplier(5)} className={`h-11 w-11 flex justify-center items-center border-2 hover:bg-zinc-600 hover:text-white font-semibold text-[12px] ${multiplier === 5 ? "bg-zinc-800 border-zinc-950 text-white" : "bg-zinc-200 border-zinc-400 rounded-md"}`}>5x</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold py-1 text-sm">Habilidades:</p>
                  <ul className="flex gap-1">
                    <li className="h-11 w-11 flex justify-center items-center bg-zinc-200 border-2 border-zinc-400 hover:bg-green-900 duration-300 group rounded-md"><GiMining size={20} className="group-hover:text-white text-zinc-700" /></li>
                    <li className="h-11 w-11 flex justify-center items-center bg-zinc-200 border-2 border-zinc-400 hover:bg-green-900 duration-300 group rounded-md"><PiSpeedometerFill size={20} className="group-hover:text-white text-zinc-700" /></li>
                    <li className="h-11 w-11 flex justify-center items-center bg-zinc-200 border-2 border-zinc-400 hover:bg-green-900 duration-300 group rounded-md"><PiCloverFill size={20} className="group-hover:text-white text-zinc-700" /></li>
                    <li className="h-11 w-11 flex justify-center items-center bg-zinc-200 border-2 border-zinc-400 hover:bg-green-900 duration-300 group rounded-md"><IoMdEye size={20} className="group-hover:text-white text-zinc-700" /></li>
                    <li className="h-11 w-11 flex justify-center items-center bg-zinc-200 border-2 border-zinc-400 hover:bg-green-900 duration-300 group rounded-md"><GiDynamite size={20} className="group-hover:text-white text-zinc-700" /></li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold py-1 text-sm">Picareta:</p>
                  <ul className="flex gap-1">
                    <li className="bg-zinc-400 border-4 border-zinc-500 hover:bg-green-900 duration-300 group rounded-md"><img src="https://cdn.rafaeldantas.dev.br/pickaxe_2.png" className="w-[30px] p-1" /></li>
                    <li className="bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group rounded-md"><img src="https://cdn.rafaeldantas.dev.br/netherite-pickaxe.png" className="w-[30px] p-1" /></li>
                    <li className="bg-zinc-300 border-2 border-zinc-400 hover:bg-green-900 duration-300 group rounded-md"><img src="https://cdn.rafaeldantas.dev.br/pickaxe_1.png" className="w-[30px] p-1" /></li>
                    <li className="bg-green-600 border-4 border-green-800 hover:bg-green-900 duration-300 group flex justify-center items-center w-[35px] rounded-md"><FaExchangeAlt color="white" /></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* blocos */}
            <div className={`${isLoading ? 'hidden lg:block' : null} lg:block flex flex-col items-center`}>
              <ul className={`grid grid-cols-8 lg:w-auto w-[90vw] gap-1 p-2 bg-zinc-400 border-4 border-zinc-500 ${isChunkLoading ? 'hidden' : null} rounded-md`}>
                {blocks.map(block => {
                  return <li key={block.posicao + '-bloco'} className={`lg:h-[45px] lg:w-[45px] w-auto bg-green-700 hover:scale-110 duration-300 border-4 border-zinc-700 hover:border-green-600 overflow-hidden rounded-md ${!block.enabled ? 'bg-zinc-400 border-none' : null} ${isLoading && block.selected ? 'animate-pulse' : null}`} onClick={() => handleSelectBlock(block)}>
                    <img className={`lg:w-[45px] w-full ${block.selected || !block.enabled ? 'opacity-0' : null}`} src={`${block.url_imagem}`}></img>
                  </li>
                })}
              </ul>
              <ul className={`grid grid-cols-8 lg:w-auto w-[90vw] gap-1 p-2 bg-zinc-300 border-4 border-zinc-500 ${!isChunkLoading ? 'hidden' : null}`}>
                {modelBlock.map(block => {
                  return <li key={block.id + '-model'} className={`lg:h-[45px] lg:w-[45px] w-full aspect-square border-4 border-zinc-700 overflow-hidden ${block.color_index === 1 ? 'bg-green-700' : block.color_index === 2 ? 'bg-green-600' : 'bg-green-500'}`}>
                  </li>
                })}
              </ul>
              <div className="p-2 bg-zinc-800 w-[250px] flex items-center gap-2 mt-2 rounded-md">
                <BsFillGrid3X3GapFill onClick={handleClickRandomChunk} size={40} className="p-2 bg-green-700 hover:bg-green-800 duration-300 text-white" />
                <div className="text-white">
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
              <p className="font-bold text-zinc-300">Minerando bloco de {selectedBlock.nome}</p>
              <div className="flex gap-2 items-center">
                <ul className="flex flex-col gap-2 mt-1">
                  <li id="loading_bar" className="lg:w-[600px] w-[90vw] box-content bg-zinc-100 border-4 border-green-800 animate-pulse rounded-md">
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
            <div className="relative lg:w-[750px] w-[90vw] lg:p-8 p-4 bg-zinc-200 drop-shadow-md border-zinc-700 flex flex-col lg:flex-row gap-4 mt-2 text-zinc-900 lg:my-0 my-8 rounded-md">
              <img src={selectedBlock.url_imagem} className="border-8 border-zinc-700 w-[120px] h-[120px] rounded-md" />
              <div className="flex-1">
                <p className="font-bold text-2xl text-zinc-800">{selectedBlock.posicao} - {selectedBlock.nome}</p>
                <p className="text-sm">Raridade: {selectedBlock.raridade}</p>
                <div className="flex items-center gap-1 my-1">
                  <IoTime />
                  <p className="font-semibold">{converterSegundosEmTexto(selectedBlock.segundos)}</p>
                </div>
                <div className="flex items-center gap-1 my-1">
                  <img src="https://cdn.rafaeldantas.dev.br/coin.png" className="w-[15px]" />
                  <p className="font-semibold">{selectedBlock.custo * multiplier}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-2 items-center p-1 bg-zinc-600 border-2 border-zinc-800 hover:bg-zinc-700 hover:border-zinc-900 duration-300">
                <FaInfo size={15} color="white" />
              </div>
              <div onClick={handleMining} className="lg:absolute lg:bottom-2 lg:right-2 flex gap-2 items-center px-4 py-2 bg-green-600 border-6 border-green-800 hover:bg-green-700 hover:border-green-900 duration-300 rounded-md">
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
          reward.length > 0 ?
            <div className="relative lg:w-[750px] w-[90vw] p-4 bg-zinc-200 drop-shadow-md text-zinc-900 mb-8 rounded-md">
              <p className="text-2xl font-bold text-zinc-800">Recompensa:</p>
              <ul className="flex gap-2 mt-2">
                {reward.map(item => {
                  return (<li className="lg:block flex gap-2">
                    <div className="h-[100px] w-[100px] flex justify-center items-center bg-gradient-to-b from-zinc-100 to-zinc-400 border-2 border-zinc-700 relative hover:scale-105 duration-300 rounded-md">
                      <div className="p-2 bg-zinc-700 flex justify-center items-center w-[20px] h-[20px] text-sm font-bold text-white absolute top-0 left-0">{item.quantidade}</div>
                      <img className="w-[50px]" src={item.url_imagem} />
                    </div>
                    <div>
                      <p className="text-[12px] w-[50px] font-semibold">{item.nome}</p>
                      <div className="flex lg:items-center lg:justify-center gap-1 mt-1">
                        <img className="w-[20px]" src="https://cdn.rafaeldantas.dev.br/coin.png" />
                        <p className="text-sm text-end font-bold">{item.preco * multiplier}</p>
                      </div>
                    </div>
                  </li>);
                })}
              </ul>
              <div onClick={handleClaim} className="lg:absolute lg:bottom-2 right-2 flex gap-2 items-center px-4 py-2 bg-green-600 border-6 border-green-800 hover:bg-green-700 hover:border-green-900 duration-300 mt-2">
                <p className="font-bold text-white">Obter recompensa</p>
                <CoinsIcon size={25} color="white" />
              </div>
            </div>
            : null
        }
        <div
          className={`fixed w-full h-screen lg:absolute lg:top-4 lg:right-4 lg:w-[600px] lg:h-auto p-8 border-8 border-zinc-950 bg-zinc-900 flex lg:flex-row lg:justify-normal items-center flex-col justify-center gap-4 duration-1000 transition-transform ${isNotificationVisible ? 'translate-x-0' : 'translate-x-[620px]'
            }`}
        >
          <img className="w-[80px]" src="https://cdn.rafaeldantas.dev.br/stone.jpeg"></img>
          <div className="h-[80px]">
            <p className="font-bold text-[16px] text-green-400">Conquista Desbloqueada!</p>
            <p className="font-bold text-[18px] text-white">Minerou o seu primeiro bloco!</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
