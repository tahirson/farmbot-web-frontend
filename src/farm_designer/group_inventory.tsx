import * as React from "react";
import { Link } from 'react-router';
import { t } from "i18next";

export class Groups extends React.Component<any, any> {
  render() {
    return(
      <div className="panel-container cyan-panel">
        <div className="panel-header cyan-panel">
          <div className="main-nav-button">
            <button className="navbar-toggle hidden-sm hidden-md hidden-lg"
                    data-target="#navbar"
                    data-toggle="collapse"
                    type="button">
              <span className="glyphicon glyphicon-menu-hamburger" />
            </button>
          </div>
          <div className="panel-tabs">
            <ul>
              <li className="hidden-sm hidden-md hidden-lg">
                  <Link to={ "/app/dashboard/designer?p1=NoTab" }>
                  {t("Designer")}
                  </Link>
              </li>
              <li>
                  <Link to={ "/app/dashboard/designer?p1=Plants" }>
                  {t("Plants")}
                  </Link>
              </li>
              <li>
                  <Link to={ "/app/dashboard/designer?p1=Groups" }
                  className={"active"}>{t("Groups")}</Link>
              </li>
              <li>
                  <Link to={ "/app/dashboard/designer?p1=Zones" }>
                  {t("Zones")}
                  </Link>
              </li>
              <li className="hidden-sm hidden-md hidden-lg">
                  <Link to={ "/app/dashboard/designer?p1=Panel2" }>
                  {t("Calendar")}
                  </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="panel-content">
          <p>Note: Groups are coming soon!</p>
          <i className="fa fa-search"></i>
          <input className="search" placeholder="Search"/>
          <div className="search-underline"></div>
          <div>
            <div className="object-list">
              <label>{t("My Groups")}</label>
              <ul>
                <li>
                  <a href="#">{("Lucky Cabages")}</a>
                  <p>{t("18 Plants")}</p>
                </li>
                <li>
                  <a href="#">{("Sandwich Sprouts")}</a>
                  <p>{t("142 Plants")}</p>
                </li>
              </ul>
            </div>
            <div className="object-list">
              <label>{("Zone Auto-Groups")}</label>
              <ul>
                <li>
                  <a href="#">{("Plants in Broccoli Overlord")}</a>
                  <p>{t("459 Plants")}</p>
                </li>
                <li>
                  <a href="#">{("Plants in Flower Patch")}</a>
                  <p>{t("22 Plants")}</p>
                </li>
              </ul>
            </div>
            <div className="object-list">
              <label>{t("Crop Auto-Groups")}</label>
              <ul>
                <li>
                  <a href="#">{("All Strawberries")}</a>
                  <p>{t("13 Plants")}</p>
                </li>
                <li>
                  <a href="#">{("All Flowers")}</a>
                  <p>{t("68 Plants")}</p>
                </li>
              </ul>
            </div>
          </div>
          <Link to="/app/dashboard/designer?p1=AddGroup">
            <div className="plus-button add-group button-like" data-toggle="tooltip" title="Add group">
              <i className="fa fa-2x fa-plus" />
            </div>
          </Link>
        </div>
      </div>
    );
  }
};
