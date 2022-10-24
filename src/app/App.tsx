import React from "react";

const registEvent = (e: React.PointerEvent<HTMLDivElement>) =>
{
    if (e.buttons !== 1) return;

    const { clientX, clientY } = e;

    const target = e.currentTarget as HTMLDivElement;

    target.setPointerCapture(e.pointerId);

    const origin = {
        x: clientX,
        y: clientY
    };

    const region = document.createElement('div');

    region.classList.add('region');
    region.style.left = origin.x + 'px';
    region.style.top = origin.y + 'px';

    target.appendChild(region);

    const items = document.getElementsByTagName('li');
    for (const i of items)
    {
        i.style.backgroundColor = 'white';
    }

    target.onmousemove = (e) => selectRegion(e, region, origin, target.scrollTop, items);

    target.onpointerup = () =>
    {
        target.onmousemove = null;
        target.onpointerup = null;

        if (target.contains(region)) target.removeChild(region);
    };
};


const selectRegion = (e: MouseEvent, region: HTMLDivElement, origin: any, scrollTop: number, items: HTMLCollection) =>
{
    region.style.border = '1px solid #0078d4';

    const { clientX, clientY } = e;

    const offsetX = origin.x - clientX;
    const offsetY = origin.y - clientY;

    const width = Math.abs(offsetX);
    const height = Math.abs(offsetY);

    region.style.width = width + 'px';
    region.style.height = height + 'px';

    if (offsetX > 0) region.style.left = origin.x - offsetX + 'px';

    let top: number = origin.y;

    if (offsetY > 0) top -= offsetY;

    if (scrollTop > 0) top += scrollTop;

    region.style.top = top + 'px';

    const from: number = origin.y + scrollTop;
    const to: number = clientY + scrollTop;

    for (const i of items)
    {
        const li = i as HTMLUListElement;

        const positionY = li.offsetTop;

        if (positionY >= from)
        {
            li.style.backgroundColor = 'red';
        } else
        {
            li.style.backgroundColor = 'white';
        }
    }
};

export default function App()
{
    return (
        <div onPointerDown={registEvent} id='app'>
            <ul>
                {(() =>
                {
                    const lis = [];
                    for (let i = 1; i <= 20; i++)
                    {
                        lis.push(<li>{i}</li>);
                    }
                    return lis;
                })()}
            </ul>
        </div>
    );
}
