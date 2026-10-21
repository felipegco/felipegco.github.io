// Catálogo copiado do seeder do e-Move (EMoveBackendApplication.java).
// O id segue a ordem de inserção do saveAll, como acontece no banco.
const VEHICLES = [
    ["Tesla", "Model 3", 491],
    ["Chevrolet", "Bolt EV", 416],
    ["Audi", "E-tron", 357],
    ["Hyundai", "Kona Eletric", 415],
    ["BMW", "i3", 246],
    ["Ford", "Mustang Mach-E", 483],
    ["Volkswagen", "ID.4", 402],
    ["Kia", "Niro EV", 385],
    ["Porsche", "Taycan", 323],
    ["BYD", "Dolphin", 291],
    ["BYD", "Dolphin Plus", 330],
    ["BYD", "Seal", 372],
    ["BYD", "Yuan Plus", 294],
    ["GWM", "Ora 03 Skin", 232],
    ["GWM", "Ora 03 GT", 232],
    ["Renault", "Kwid E-Tech", 185],
    ["Volvo", "EX30", 250],
    ["Volvo", "XC40 Recharge Plus", 326],
    ["Volvo", "C40 Recharge Plus", 332],
    ["Peugeot", "e-2008", 234],
    ["Peugeot", "e-208 GT", 220],
    ["JAC", "E-JS1", 161],
    ["Caoa Chery", "iCar", 197],
    ["Mini", "Cooper S E (Elétrico)", 161],
    ["Nissan", "Leaf", 272],
    ["Chevrolet", "Bolt EV", 251],
    ["BMW", "iX3", 305],
    ["BMW", "i4", 350],
    ["Renault", "Megane E-Tech", 337],
].map(([marca, modelo, autonomia], i) => ({ id: i + 1, marca, modelo, autonomia }));

export default VEHICLES;

// Mesma conta do VeiculoService.atualizarNivelBateria
export function toVeiculoDTO(vehicle, nivelBateria) {
    return {
        id: vehicle.id,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        nivelBateria,
        autonomiaTotal: vehicle.autonomia,
        autonomiaEstimada: vehicle.autonomia * (nivelBateria / 100.0),
    };
}
