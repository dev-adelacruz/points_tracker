# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Host Performance Report" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host) { create(:user, :host) }
  let(:team) { create(:team) }

  describe "#show" do
    path "/api/v1/reports/host_performance" do
      get "returns session-by-session performance report for a host" do
        tags "Reports"
        produces "application/json"

        parameter name: :host_id,    in: :query, type: :integer, required: true
        parameter name: :start_date, in: :query, type: :string,  required: true
        parameter name: :end_date,   in: :query, type: :string,  required: true

        response(200, "returns attended and absent sessions with daily and weekly aggregates") do
          let(:host_id)    { host.id }
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before do
            create(:team_membership, team: team, user: host)
            attended = create(:session, date: "2026-01-15", team: team)
            absent   = create(:session, date: "2026-01-20", team: team, session_slot: :slot_two)
            attended.session_hosts.create!(user: host)
            create(:coin_entry, user: host, session: attended, coins: 200)
            absent
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            data = json_response[:data]
            expect(data[:host_id]).to eq(host.id)
            expect(data[:monthly_total]).to eq(200)

            sessions = data[:sessions]
            expect(sessions.length).to eq(2)
            attended_row = sessions.find { |s| s[:attended] == true }
            absent_row   = sessions.find { |s| s[:attended] == false }
            expect(attended_row[:coins]).to eq(200)
            expect(absent_row[:coins]).to eq(0)

            expect(data[:daily_totals].first[:coins]).to eq(200)
            expect(data[:weekly_totals]).not_to be_empty
          end
        end

        response(200, "returns empty sessions when host has no team sessions in range") do
          let(:host_id)    { host.id }
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status(:ok)
            data = json_response[:data]
            expect(data[:sessions]).to be_empty
            expect(data[:monthly_total]).to eq(0)
          end
        end

        response(404, "returns 404 when host does not exist") do
          let(:host_id)    { 0 }
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status(:not_found)
          end
        end

        response(422, "returns error when params are missing") do
          let(:host_id)    { nil }
          let(:start_date) { nil }
          let(:end_date)   { nil }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status(:unprocessable_content)
          end
        end

        response(403, "forbids non-admin roles") do
          let(:host_id)    { host.id }
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status(:forbidden)
          end
        end
      end
    end
  end
end
