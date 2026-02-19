import React from 'react'
import { Route, Routes } from 'react-router-dom'
import NumberGame from './NumberGame'
import GameSummary from './GameSummary';

function GamesLayout() {
  return (
    <div className='game-layout'>
        <div className='game-inner-layout'>
            <Routes>
                <Route path="/numbergame" element={<NumberGame />}/>
                <Route path='/summary' element={<GameSummary />}/>
            </Routes>
        </div>
    </div>
  )
}

export default GamesLayout