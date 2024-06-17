-- CREATE TABLE medidor
-- (
--  id INT PRIMARY KEY,
--  zone VARCHAR(50),
--  meterExtra VARCHAR(50),
--  type VARCHAR(50)
-- );


CREATE TABLE users
(
 id INT PRIMARY KEY,
 name VARCHAR(100),
 names VARCHAR(200),
 address VARCHAR(200),
 department VARCHAR(50),
 province VARCHAR(50),
 district VARCHAR(50),
 trunk VARCHAR(50),
 substation VARCHAR(50),
 rate VARCHAR(50),
 meter_serial_number VARCHAR(50),
 model VARCHAR(50),
 installed_power_sum FLOAT,
 contracted_power_sum FLOAT,
 ciiu_description VARCHAR(200),
 ciiu_code VARCHAR(50),
 business_activity VARCHAR(100),
 voltage VARCHAR(100),
 number_of_wires INT,
 current_factor_sum VARCHAR(100),
 voltage_factor_sum VARCHAR(100),
 constant FLOAT,
 service_status VARCHAR(50),
 sed_x_coordinate VARCHAR(50),
 sed_y_coordinate VARCHAR(50)
);

CREATE TABLE reading
(
 id SERIAL PRIMARY KEY,
 nis_id INT,
 fa_wh_delivered VARCHAR(50),
 fa_wh_max_demand_delivered VARCHAR(50),
 fa_wh_cumulative_demand_delivered VARCHAR(50),
 fa_wh_date_delivered TIMESTAMP,

 fb_wh_delivered VARCHAR(50),
 fb_wh_max_demand_delivered VARCHAR(50),
 fb_wh_cumulative_demand_delivered VARCHAR(50),
 fb_wh_date_delivered TIMESTAMP,

 fc_wh_delivered VARCHAR(50),
 fc_wh_max_demand_delivered VARCHAR(50),
 fc_wh_cumulative_demand_delivered VARCHAR(50),
 fc_wh_date_delivered TIMESTAMP,

 fd_wh_delivered VARCHAR(50),
 fd_wh_max_demand_delivered VARCHAR(50),
 fd_wh_cumulative_demand_delivered VARCHAR(50),
 fd_wh_date_delivered TIMESTAMP,

 ft_wh_delivered VARCHAR(50),
 ft_wh_max_demand_delivered VARCHAR(50),
 ft_wh_cumulative_demand_delivered VARCHAR(50),
 ft_wh_date_delivered TIMESTAMP,

 fa_varh_delivered VARCHAR(50),
 fa_varh_max_demand_delivered VARCHAR(50),
 fa_varh_cumulative_demand_delivered VARCHAR(50),
 fa_varh_date_delivered TIMESTAMP,

 fb_varh_delivered VARCHAR(50),
 fb_varh_max_demand_delivered VARCHAR(50),
 fb_varh_cumulative_demand_delivered VARCHAR(50),
 fb_varh_date_delivered TIMESTAMP,

 fc_varh_delivered VARCHAR(50),
 fc_varh_max_demand_delivered VARCHAR(50),
 fc_varh_cumulative_demand_delivered VARCHAR(50),
 fc_varh_date_delivered TIMESTAMP,

 fd_varh_delivered VARCHAR(50),
 fd_varh_max_demand_delivered VARCHAR(50),
 fd_varh_cumulative_demand_delivered VARCHAR(50),
 fd_varh_date_delivered TIMESTAMP,

 ft_varh_delivered VARCHAR(50),
 ft_varh_max_demand_delivered VARCHAR(50),
 ft_varh_cumulative_demand_delivered VARCHAR(50),
 ft_varh_date_delivered TIMESTAMP,

 fa_wh_received VARCHAR(50),
 fa_wh_max_demand_received VARCHAR(50),
 fa_wh_cumulative_demand_received VARCHAR(50),
 fa_wh_date_received TIMESTAMP,

 fb_wh_received VARCHAR(50),
 fb_wh_max_demand_received VARCHAR(50),
 fb_wh_cumulative_demand_received VARCHAR(50),
 fb_wh_date_received TIMESTAMP,

 fc_wh_received VARCHAR(50),
 fc_wh_max_demand_received VARCHAR(50),
 fc_wh_cumulative_demand_received VARCHAR(50),
 fc_wh_date_received TIMESTAMP,

 fd_wh_received VARCHAR(50),
 fd_wh_max_demand_received VARCHAR(50),
 fd_wh_cumulative_demand_received VARCHAR(50),
 fd_wh_date_received TIMESTAMP,

 ft_wh_received VARCHAR(50),
 ft_wh_max_demand_received VARCHAR(50),
 ft_wh_cumulative_demand_received VARCHAR(50),
 ft_wh_date_received TIMESTAMP,

 fa_varh_received VARCHAR(50),
 fa_varh_max_demand_received VARCHAR(50),
 fa_varh_cumulative_demand_received VARCHAR(50),
 fa_varh_date_received TIMESTAMP,

 fb_varh_received VARCHAR(50),
 fb_varh_max_demand_received VARCHAR(50),
 fb_varh_cumulative_demand_received VARCHAR(50),
 fb_varh_date_received TIMESTAMP,

 fc_varh_received VARCHAR(50),
 fc_varh_max_demand_received VARCHAR(50),
 fc_varh_cumulative_demand_received VARCHAR(50),
 fc_varh_date_received TIMESTAMP,

 fd_varh_received VARCHAR(50),
 fd_varh_max_demand_received VARCHAR(50),
 fd_varh_cumulative_demand_received VARCHAR(50),
 fd_varh_date_received TIMESTAMP,

 ft_varh_received VARCHAR(50),
 ft_varh_max_demand_received VARCHAR(50),
 ft_varh_cumulative_demand_received VARCHAR(50),
 ft_varh_date_received TIMESTAMP,

 fa_pw_01 VARCHAR(50),
 fb_pw_01 VARCHAR(50),
 fc_pw_01 VARCHAR(50),
 fd_pw_01 VARCHAR(50),
 ft_pw_01 VARCHAR(50),

 fa_pw_23 VARCHAR(50),
 fb_pw_23 VARCHAR(50),
 fc_pw_23 VARCHAR(50),
 fd_pw_23 VARCHAR(50),
 ft_pw_23 VARCHAR(50),

 FOREIGN KEY (nis_id) REFERENCES users (id)
);


CREATE TABLE instrumentation
(
 id SERIAL PRIMARY KEY,
 nis_id INT,
 fa_voltage VARCHAR(50),
 fb_voltage VARCHAR(50),
 fc_voltage VARCHAR(50),
 fa_current VARCHAR(50),
 fb_current VARCHAR(50),
 fc_current VARCHAR(50),
 system_watts VARCHAR(50),
 set_number VARCHAR(50),
 date TIMESTAMP,
 FOREIGN KEY (nis_id) REFERENCES users (id)
);

CREATE TABLE energy
(
 id SERIAL PRIMARY KEY,
 nis_id INT,
 date TIMESTAMP,
 active_energy VARCHAR(50),
 reactive_energy VARCHAR(50),
 FOREIGN KEY (nis_id) REFERENCES users (id)
);

CREATE TABLE percentile
(
 id SERIAL PRIMARY KEY,
 nis_id INT,
 p1 FLOAT,
 p99 FLOAT,
 p0_5 FLOAT,
 p99_5 FLOAT,
 p0_1 FLOAT,
 p99_9 FLOAT,
 hour INT,
 FOREIGN KEY (nis_id) REFERENCES users (id)
);

CREATE TABLE alerts
(
 id SERIAL PRIMARY KEY,
 nis_id INT,
 date TIMESTAMP,
 hour INT,
 alert_type VARCHAR(50),
 value FLOAT,
 FOREIGN KEY (nis_id) REFERENCES users (id)
);
