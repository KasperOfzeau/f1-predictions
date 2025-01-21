# F1 Predictions

## Overzicht
Dit project bevat een frontend gebouwd met **Next.js** en **Tailwind CSS** en een backend gebouwd met **Nest.js**.

## Installaties
### Frontend
- **Framework**: [Next.js](https://nextjs.org/) 
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

### Backend
- **Framework**: [Nest.js](https://nestjs.com/)

## Hoe te runnen

### 1. **Project clonen**
Clone de repository:
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. **Frontend opzetten**
Ga naar de `frontend` map en installeer de dependencies:
```bash
cd frontend
npm install
```

Start de frontend development server:
```bash
npm run dev
```
De frontend is bereikbaar op [http://localhost:3000](http://localhost:3000).

---

### 3. **Backend opzetten**
Ga naar de `backend` map en installeer de dependencies:
```bash
cd backend
npm install
```

Start de backend development server:
```bash
npm run start:dev
```
De backend is bereikbaar op [http://localhost:3001](http://localhost:3001).

---

## Wat is er gemaakt?

- **Frontend testpagina:**
  - Een eenvoudige Next.js-pagina toont een bericht dat wordt opgehaald van de backend.
  - De styling wordt verzorgd door Tailwind CSS.

- **Backend endpoint:**
  - Een standaard Nest.js GET-endpoint op `/` dat "Hello World!" retourneert als plain text.


