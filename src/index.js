import { SpaceX } from "./api/spacex.js";
import * as d3 from "d3";

document.addEventListener("DOMContentLoaded", setup);

async function setup() {
    const spaceX = new SpaceX();

    const [launches, launchpads, geoData] = await Promise.all([
        spaceX.launches(),
        spaceX.launchpads(),
        fetch("/src/geo.json").then(res => res.json())
    ]);

    const listContainer = document.getElementById("listContainer");
    renderLaunches(launches, listContainer, launchpads);
    drawMap(launchpads, geoData);
}

function renderLaunches(launches, container, launchpads) {
    
    const list = document.createElement("ul");

    launches.forEach(launch => {
        const item = document.createElement("li");
        item.textContent = launch.name;

        const launchpadId = launch.launchpad;
        const style = document.createElement('style');
        style.textContent = `
    li.active {
        background-color: #fff3cd;
        border-left: 3px solid #ffc107;
    }
    .launchpad-dot {
        transition: fill 0.3s ease, r 0.3s ease;
    }
    .launchpad-dot.highlighted {
        fill: yellow !important;
        r: 12;
        stroke: orange;
        stroke-width: 2;
    }
`;
document.head.appendChild(style);


item.addEventListener("mouseenter", () => {
    item.classList.add('active');
    d3.selectAll(".launchpad-dot")
        .classed("highlighted", false);
    d3.select(`.launchpad-${launchpadId}`)
        .classed("highlighted", true);
});

item.addEventListener("mouseleave", () => {
    item.classList.remove('active');
    d3.selectAll(".launchpad-dot")
        .classed("highlighted", false);
});

        list.appendChild(item);
    });

    container.replaceChildren(list);
}

function drawMap(launchpads, geoData) {
    const width = 640;
    const height = 480;
    const margin = { top: 20, right: 10, bottom: 40, left: 100 };

    const svg = d3.select("#map")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const projection = d3.geoMercator()
        .scale(130)
        .center([0, 20])
        .translate([width / 2 - margin.left, height / 2]);

    // Отрисовка карты (GeoJSON)
    svg.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "#ccc")
        .attr("stroke", "#333")
        .style("opacity", 0.8);

    // Добавляем точки launchpads с правильными классами
    svg.append("g")
        .selectAll("circle")
        .data(launchpads)
        .enter()
        .append("circle")
        .attr("cx", d => {
            const coords = projection([d.longitude, d.latitude]);
            return coords ? coords[0] : 0;
        })
        .attr("cy", d => {
            const coords = projection([d.longitude, d.latitude]);
            return coords ? coords[1] : 0;
        })
        .attr("r", 8) // Увеличил радиус для лучшей видимости
        .attr("fill", "red")
        .attr("opacity", 0.8)
        .attr("class", d => `launchpad-dot launchpad-${d.id}`) // Два класса через пробел
        .append("title") // Добавляем tooltip
        .text(d => d.name);
}