'use client';

import { useState } from 'react';
import VEHICLES, { toVeiculoDTO } from '@/lib/emove-catalog';

export default function EmoveConsole({ dict }) {
    const [vehicleId, setVehicleId] = useState(1);
    const [battery, setBattery] = useState(80);

    const vehicle = VEHICLES.find((v) => v.id === vehicleId);
    const dto = toVeiculoDTO(vehicle, battery);
    const km = String(Math.round(dto.autonomiaEstimada * 10) / 10).replace('.', dict.decimal);

    return (
        <section id="console" className="console" aria-labelledby="console-title">
            <div className="console-copy">
                <h2 id="console-title" className="lead" data-reveal>{dict.title}</h2>
                <p data-reveal style={{ '--i': 1 }}>{dict.lead}</p>

                <p className="console-figure" aria-live="polite" data-reveal style={{ '--i': 2 }}>
                    <strong>{km} km</strong>
                    <span>{dict.result}</span>
                </p>

                <label className="field" data-reveal style={{ '--i': 3 }}>
                    <span className="field-label">{dict.vehicle}</span>
                    <select value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value))}>
                        {VEHICLES.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.marca} {v.modelo}, {v.autonomia} km
                            </option>
                        ))}
                    </select>
                </label>

                <label className="field" data-reveal style={{ '--i': 4 }}>
                    <span className="field-label">
                        <span>{dict.battery}</span>
                        <span>{battery}%</span>
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={battery}
                        onChange={(e) => setBattery(Number(e.target.value))}
                    />
                </label>
            </div>

            <div className="console-code" data-reveal style={{ '--i': 2 }}>
                <div className="code-rig">
                    <pre className="code-block"><code>
                        <span className="code-title">{dict.request}</span>
                        <span className="k">PUT</span> /api/veiculos/{dto.id}/bateria{'\n'}
                        {'{ '}<span className="s">"nivelBateria"</span>: <span className="n">{battery}</span>{' }'}
                    </code></pre>
                    <pre className="code-block"><code>
                        <span className="code-title">{dict.response}</span>
                        {'{\n'}
                        {'  '}<span className="s">"id"</span>: <span className="n">{dto.id}</span>,{'\n'}
                        {'  '}<span className="s">"marca"</span>: <span className="s">"{dto.marca}"</span>,{'\n'}
                        {'  '}<span className="s">"modelo"</span>: <span className="s">"{dto.modelo}"</span>,{'\n'}
                        {'  '}<span className="s">"nivelBateria"</span>: <span className="n">{dto.nivelBateria}</span>,{'\n'}
                        {'  '}<span className="s">"autonomiaTotal"</span>: <span className="n">{dto.autonomiaTotal}</span>,{'\n'}
                        {'  '}<span className="s">"autonomiaEstimada"</span>: <span className="n">{dto.autonomiaEstimada.toFixed(1)}</span>{'\n'}
                        {'}'}
                    </code></pre>
                </div>
            </div>
        </section>
    );
}
