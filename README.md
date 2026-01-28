<div align="center">

## Building the future with performance and design

Este é o meu portfólio pessoal reconstruído do zero para alcançar o máximo de performance e uma experiência de usuário impecável, utilizando as tecnologias mais modernas do ecossistema React.

</div>

## 🛠️ Technologies Used

<div align="center">

![Next.js 16](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Lucide React](https://img.shields.io/badge/Lucide_Icons-FF69B4?style=for-the-badge&logo=lucide&logoColor=white)
![Git](https://img.shields.io/badge/GIT-E44C30?style=for-the-badge&logo=git&logoColor=white)

**Fonts:** Google Fonts (Geist Sans & Mono)
**Framework:** Next.js 16.1 (App Router)
**Styling:** Tailwind CSS v4.0 + FontAwesome
**State/Theming:** Next-Themes

</div>

## 📁 Project Structure

```bash
src/
├── app/
│   ├── [lang]/          # Rotas dinâmicas para i18n (en/pt)
│   │   ├── page.js      # Página principal
│   │   └── layout.js    # Layout com ThemeProvider
│   └── globals.css      # Variáveis CSS e Tailwind v4 config
├── components/
│   ├── sections/        # Seções (Hero, About, Projects, Footer)
│   └── ui/              # Componentes reutilizáveis (Cards, Badges, Toggles)
├── dictionaries/        # Arquivos JSON de tradução
├── lib/                 # Utilitários (get-dictionary.js)
├── providers/           # Context Providers (Theme)
└── public/              # Ativos estáticos (Imagens, Ícones)
