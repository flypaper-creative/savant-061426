const fs = require('fs');
let content = fs.readFileSync('src/components/CockpitOverlay.tsx', 'utf8');

const jsxRegex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?(?=<div className="mt-10 pt-4 text-center)/;
const jsxReplacement = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {generatedPerks.map((p, idx) => {
                 const Icon = p.icon;
                 return (
                  <div key={idx}
                    onClick={() => {
                      if (p.id === 'hull') { p.apply(setPerks, (v) => setShield(perks.maxShield), setEnergy); } else { p.apply(setPerks, setShield, setEnergy); }
                      playSound.upgrade();
                      setPhase('PLAYING');
                    }}
                    className="group bg-transparent border border-white/10 hover:border-white/50 p-8 text-left transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between relative"
                  >
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 transition-colors"></div>
                    <div>
                      <div className="w-12 h-12 flex items-center justify-center mb-5 text-white/50 group-hover:scale-110 transition-all">
                        <Icon className="w-6 h-6 drop-shadow-md" style={{ color: p.color }} />
                      </div>
                      <h3 className="text-lg tracking-[0.2em] transition-colors font-sans uppercase" style={{ color: p.color }}>{p.title}</h3>
                      <p className="text-[10px] text-[#F5F2ED]/50 mt-3 leading-relaxed font-mono uppercase">
                        {p.desc}
                      </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-white/40 transition-colors" style={{ color: p.color }}>
                      <span>{p.category}</span>
                      <span>SELECT &rarr;</span>
                    </div>
                  </div>
                 );
              })}
            </div>\n\n            `;
content = content.replace(jsxRegex, jsxReplacement);

fs.writeFileSync('src/components/CockpitOverlay.tsx', content);
