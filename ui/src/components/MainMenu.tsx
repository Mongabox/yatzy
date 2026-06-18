import { motion } from "motion/react";
import { sendToHost } from "../bridge";

export function MainMenu({ requestId }: { requestId: string }) {
  return (
    <div className="menu-screen">
      <motion.div
        className="menu-card"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="menu-logo">YATZY / v1.0</div>

        <h1 className="menu-heading">Яцы</h1>
        <p className="menu-sub">
          Покер на костях. 5 кубиков, 13 раундов, один соперник.
        </p>

        <div className="menu-rules">
          <div className="menu-rules__title">Как играть</div>
          <ul className="menu-rules__list">
            <li className="menu-rules__item">Первый бросок — все 5 кубиков автоматически</li>
            <li className="menu-rules__item">Выберите кубики для переброса (до 3 бросков за раунд)</li>
            <li className="menu-rules__item">Запишите результат в одну из 13 категорий</li>
            <li className="menu-rules__item">Верхняя секция &ge;63 очков — бонус +35</li>
            <li className="menu-rules__item">После 13 раундов побеждает набравший больше</li>
          </ul>
        </div>

        <div className="menu-actions">
          <button
            id="btn-play"
            className="btn btn--primary"
            onClick={() => sendToHost({ type: "MENU_ACTION", requestId, data: "Play" })}
          >
            Начать игру
          </button>
          <button
            id="btn-exit"
            className="btn btn--ghost"
            onClick={() => sendToHost({ type: "MENU_ACTION", requestId, data: "Exit" })}
          >
            Выйти
          </button>
        </div>
      </motion.div>
    </div>
  );
}
