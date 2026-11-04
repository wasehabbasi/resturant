
import "./StatCard.css";

const StatCard = ({ title, value, change, icon: Icon }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span>{title}</span>

        <div className="stat-icon">
          <Icon size={21} />
        </div>
      </div>

      <h2>{value}</h2>

      <p className="stat-change">
        {change}
      </p>
    </div>
  );
};

export default StatCard;
