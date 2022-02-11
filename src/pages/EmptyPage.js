import React from 'react';
import { memoLocation } from '../utilities/LocationMemoization';

const EmptyPage = () => {

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>Empty Page</h5>
                    <p>Use this page to start from scratch and place your custom content.</p>
                </div>
            </div>
        </div>
    );
}


export default memoLocation(EmptyPage);
